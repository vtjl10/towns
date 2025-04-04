#!/usr/bin/env bash

function parse_git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/'
}

function make_pr_description() {
    # Use git log to list commit messages not present on origin/main
    git log origin/main..HEAD
}

# You must be on main with a clean working directory to run this script.
if [[ "$(git status --porcelain)" != "" ]]; then
    echo "There are uncommitted changes. Please commit or stash them before running this script."
    exit 1
elif [[ "$(parse_git_branch)" != "main" ]]; then
    echo "You must be on the main branch to run this script."
    exit 1
fi

# get the current git hash 
COMMIT_HASH=$(git rev-parse --short HEAD)
BRANCH_NAME="release-sdk/${COMMIT_HASH}"
PR_TITLE="Release SDK ${COMMIT_HASH}"
VERSION_PREFIX="sdk-${COMMIT_HASH}-"

git checkout -b "${BRANCH_NAME}"

./scripts/yarn-clean.sh
yarn install --immutable
exit_status_yarn=$?

if [ $exit_status_yarn -ne 0 ]; then
    echo "yarn install failed."
    exit 1
fi

yarn build
exit_status_yarn=$?

if [ $exit_status_yarn -ne 0 ]; then
    echo "yarn build failed."
    exit 1
fi

# build docs
yarn workspace @towns-protocol/react-sdk gen
exit_status_docgen=$?

if [ $exit_status_docgen -ne 0 ]; then
    echo "yarn workspace @towns-protocol/react-sdk gen failed."
    exit 1
fi

git add packages/docs/
git commit -m "docs for version ${VERSION_PREFIX}"

# copy contracts
./packages/generated/scripts/copy-addresses.sh
git add packages/generated/deployments
git commit -m "deployments for version ${VERSION_PREFIX}"

git push -u origin "${BRANCH_NAME}"

# Get the new patch version from Lerna and tag it
npx lerna version patch --yes --force-publish --no-private --tag-version-prefix "${VERSION_PREFIX}"

PR_DESCRIPTION="$(make_pr_description)"

# Create PR and capture the PR number
PR_URL=$(gh pr create --base main --head "${BRANCH_NAME}" --title "${PR_TITLE}" --body "${PR_DESCRIPTION}")
if [ $? -ne 0 ]; then
    echo "Failed to create PR"
    exit 1
fi
PR_NUMBER=$(echo $PR_URL | rev | cut -d'/' -f1 | rev)

# Enable auto-merge
gh pr merge "${PR_NUMBER}" --auto --squash

echo "Created PR #${PR_NUMBER}"

while true; do
    WAIT_TIME=5
    while true; do
    OUTPUT=$(gh pr checks "${BRANCH_NAME}" 2>&1)
    if [[ "$OUTPUT" == *"no checks reported on the '${BRANCH_NAME}' branch"* ]]; then
        echo "Checks for '${BRANCH_NAME}' haven't started yet. Waiting for $WAIT_TIME seconds..."
        sleep $WAIT_TIME
    else
        break
    fi
    done

    gh pr checks "${BRANCH_NAME}" --fail-fast --interval 2 --watch
    exit_status=$?

    # Check if the command succeeded or failed
    if [ $exit_status -ne 0 ]; then
        echo "Failure detected in PR checks."
        if [[ $USER_MODE -eq 1 ]]; then
            read -p "Harmony CI is failing. Restart CI. (any key to retry/q) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Qq]$ ]]; then
                echo "Pull request creation aborted."
                exit $exit_status
            fi
        else
            echo "Harmony CI is failing. Restart CI."
            exit $exit_status
        fi
    else 
        echo "All checks passed."
        break
    fi
done

# Wait for PR to be merged using the specific PR number
TIMEOUT=2100  # 35 minutes in seconds
START_TIME=$(date +%s)

while gh pr view "$PR_NUMBER" --json state -q ".state" | grep -q "OPEN"; do
    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$(($CURRENT_TIME - $START_TIME))

    if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
        echo "Error: Timed out waiting for PR #${PR_NUMBER} to merge after 35 minutes"
        exit 1
    fi

    echo "Waiting for PR #${PR_NUMBER} to be merged..."
    sleep 30
done
echo "PR #${PR_NUMBER} has been merged"

# Pull the changes to local main
git pull --rebase

# Publish the nightly version to npm
echo "Starting Lerna publish..."
npx lerna publish from-package --yes --no-private --force-publish --tag-version-prefix "${VERSION_PREFIX}" || {
    echo "Lerna publish failed with exit code $?"
    exit 1
}
echo "Lerna publish completed successfully"
