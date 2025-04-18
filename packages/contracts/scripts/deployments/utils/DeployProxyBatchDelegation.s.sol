// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

//interfaces

//libraries

//contracts
import {Deployer} from "../../common/Deployer.s.sol";
import {ProxyBatchDelegation} from "src/tokens/mainnet/delegation/ProxyBatchDelegation.sol";
import {MockMessenger} from "test/mocks/MockMessenger.sol";

// deployments
import {DeployTownsMainnet} from "./DeployTownsMainnet.s.sol";

contract DeployProxyBatchDelegation is Deployer {
    // Mainnet
    DeployTownsMainnet internal townsHelper = new DeployTownsMainnet();

    address public townsToken;
    address public claimers;
    address public mainnetDelegation;
    address public messenger;
    address public vault;

    function versionName() public pure override returns (string memory) {
        return "utils/proxyBatchDelegation";
    }

    function setDependencies(address mainnetDelegation_, address messenger_) external {
        mainnetDelegation = mainnetDelegation_;
        messenger = messenger_;
    }

    function __deploy(address deployer) internal override returns (address) {
        townsToken = townsHelper.deploy(deployer);
        vault = townsHelper.vault();
        vm.broadcast(deployer);
        claimers = deployCode("AuthorizedClaimers.sol", "");

        if (messenger == address(0)) {
            if (isAnvil() || isTesting()) {
                vm.broadcast(deployer);
                messenger = address(new MockMessenger());
            } else {
                messenger = getMessenger();
            }
        }

        if (mainnetDelegation == address(0)) {
            mainnetDelegation = _getMainnetDelegation();
        }

        if (townsToken == address(0)) {
            revert("DeployProxyBatchDelegation: Towns token not deployed");
        }

        if (claimers == address(0)) {
            revert("DeployProxyBatchDelegation: Claimers not deployed");
        }

        vm.broadcast(deployer);
        return
            address(new ProxyBatchDelegation(townsToken, claimers, messenger, mainnetDelegation));
    }

    function _getMainnetDelegation() internal returns (address) {
        if (block.chainid == 84_532 || block.chainid == 11_155_111) {
            // base registry on base sepolia
            return 0x08cC41b782F27d62995056a4EF2fCBAe0d3c266F;
        }

        if (block.chainid == 1) {
            // Base Registry contract on Base
            return 0x7c0422b31401C936172C897802CF0373B35B7698;
        }

        return getDeployment("baseRegistry");
    }

    function getMessenger() public view returns (address) {
        // Base or Base (Sepolia)
        if (block.chainid == 8453 || block.chainid == 84_532) {
            return 0x4200000000000000000000000000000000000007;
        } else if (block.chainid == 1) {
            // Mainnet
            return 0x866E82a600A1414e583f7F13623F1aC5d58b0Afa;
        } else if (block.chainid == 11_155_111) {
            // Sepolia
            return 0xC34855F4De64F1840e5686e64278da901e261f20;
        } else {
            revert("DeployProxyDelegation: Invalid network");
        }
    }
}
