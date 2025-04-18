// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// interfaces
import {IRolesBase} from "./IRoles.sol";
import {IEntitlement} from "src/spaces/entitlements/IEntitlement.sol";

// libraries
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {StringSet} from "../../../utils/libraries/StringSet.sol";
import {Validator} from "../../../utils/libraries/Validator.sol";

// services
import {RolesStorage} from "./RolesStorage.sol";
import {ChannelService} from "src/spaces/facets/channels/ChannelService.sol";
import {EntitlementsManagerService} from "src/spaces/facets/entitlements/EntitlementsManagerService.sol";

abstract contract RolesBase is IRolesBase {
    using StringSet for StringSet.Set;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    // =============================================================
    //                         Role Management
    // =============================================================
    function _createRole(
        string calldata roleName,
        string[] memory permissions,
        CreateEntitlement[] memory entitlements
    ) internal returns (uint256 roleId) {
        Validator.checkLength(roleName, 2);

        uint256 entitlementsLen = entitlements.length;

        IEntitlement[] memory entitlementAddresses = new IEntitlement[](entitlementsLen);

        roleId = _getNextRoleId();

        for (uint256 i = 0; i < entitlementsLen; ) {
            EntitlementsManagerService.validateEntitlement(address(entitlements[i].module));
            entitlementAddresses[i] = entitlements[i].module;

            // check for empty address or data
            Validator.checkByteLength(entitlements[i].data);

            EntitlementsManagerService.proxyAddRoleToEntitlement(
                address(entitlements[i].module),
                roleId,
                entitlements[i].data
            );

            unchecked {
                i++;
            }
        }

        _addRole(roleName, false, permissions, entitlementAddresses);

        emit RoleCreated(msg.sender, roleId);
    }

    function _getRoles() internal view returns (Role[] memory roles) {
        uint256[] memory roleIds = _getRoleIds();
        uint256 roleIdLen = roleIds.length;

        roles = new Role[](roleIdLen);

        for (uint256 i = 0; i < roleIdLen; ) {
            (
                string memory name,
                bool isImmutable,
                string[] memory permissions,
                IEntitlement[] memory entitlements
            ) = _getRole(roleIds[i]);

            roles[i] = Role({
                id: roleIds[i],
                name: name,
                disabled: isImmutable,
                permissions: permissions,
                entitlements: entitlements
            });

            unchecked {
                i++;
            }
        }
    }

    function _getRolesWithPermission(
        string memory permission
    ) internal view returns (Role[] memory) {
        uint256[] memory roleIds = _getRoleIds();
        uint256 roleIdLen = roleIds.length;
        Role[] memory rolesWithPermission = new Role[](roleIdLen);
        uint256 count = 0;

        bytes32 requestedPermission = keccak256(bytes(permission));

        for (uint256 i = 0; i < roleIdLen; i++) {
            (
                string memory name,
                bool isImmutable,
                string[] memory permissions,
                IEntitlement[] memory entitlements
            ) = _getRole(roleIds[i]);

            for (uint256 j = 0; j < permissions.length; j++) {
                if (keccak256(bytes(permissions[j])) == requestedPermission) {
                    rolesWithPermission[count] = Role({
                        id: roleIds[i],
                        name: name,
                        disabled: isImmutable,
                        permissions: permissions,
                        entitlements: entitlements
                    });
                    count++;
                    break;
                }
            }
        }

        // Resize the array to remove unused slots
        assembly {
            mstore(rolesWithPermission, count)
        }

        return rolesWithPermission;
    }

    function _getRoleById(uint256 roleId) internal view returns (Role memory role) {
        (
            string memory name,
            bool isImmutable,
            string[] memory permissions,
            IEntitlement[] memory entitlements
        ) = _getRole(roleId);

        return
            Role({
                id: roleId,
                name: name,
                disabled: isImmutable,
                permissions: permissions,
                entitlements: entitlements
            });
    }

    // make nonreentrant
    function _updateRole(
        uint256 roleId,
        string calldata roleName,
        string[] memory permissions,
        CreateEntitlement[] memory entitlements
    ) internal {
        // check role exists
        _checkRoleExists(roleId);

        // get current entitlements before updating them
        IEntitlement[] memory currentEntitlements = _getEntitlementsByRole(roleId);
        uint256 currentEntitlementsLen = currentEntitlements.length;

        uint256 entitlementsLen = entitlements.length;
        IEntitlement[] memory entitlementAddresses = new IEntitlement[](entitlementsLen);

        for (uint256 i = 0; i < entitlementsLen; ) {
            address module = address(entitlements[i].module);
            EntitlementsManagerService.validateEntitlement(module);
            EntitlementsManagerService.checkEntitlement(module);
            entitlementAddresses[i] = entitlements[i].module;
            unchecked {
                i++;
            }
        }

        // Update the role name
        if (bytes(roleName).length > 0) {
            RolesStorage.layout().roleById[roleId].name = roleName;
        }

        // Update permissions
        if (permissions.length > 0) {
            string[] memory currentPermissions = RolesStorage
                .layout()
                .roleById[roleId]
                .permissions
                .values();

            // Remove all the current permissions
            _removePermissionsFromRole(roleId, currentPermissions);

            // Add all the new permissions
            _addPermissionsToRole(roleId, permissions);
        }

        if (entitlementsLen == 0) {
            return;
        }

        if (entitlementAddresses.length > 0) {
            uint256 entitlementAddressesLen = entitlementAddresses.length;

            for (uint256 i = 0; i < currentEntitlementsLen; ) {
                _removeEntitlementFromRole(roleId, address(currentEntitlements[i]));
                unchecked {
                    i++;
                }
            }

            // Add all the new entitlements
            for (uint256 i = 0; i < entitlementAddressesLen; ) {
                _addEntitlementToRole(roleId, address(entitlementAddresses[i]));
                unchecked {
                    i++;
                }
            }
        }

        // loop through old entitlements and remove them
        for (uint256 i = 0; i < currentEntitlementsLen; ) {
            // fetch entitlement data and if it's not empty, remove it
            bytes memory entitlementData = IEntitlement(currentEntitlements[i])
                .getEntitlementDataByRoleId(roleId);

            if (entitlementData.length > 0) {
                EntitlementsManagerService.proxyRemoveRoleFromEntitlement(
                    address(currentEntitlements[i]),
                    roleId
                );
            }

            unchecked {
                i++;
            }
        }

        for (uint256 i = 0; i < entitlementsLen; ) {
            if (entitlements[i].data.length > 0) {
                // check for empty address or data
                Validator.checkByteLength(entitlements[i].data);

                EntitlementsManagerService.proxyAddRoleToEntitlement(
                    address(entitlements[i].module),
                    roleId,
                    entitlements[i].data
                );
            }

            unchecked {
                i++;
            }
        }

        emit RoleUpdated(msg.sender, roleId);
    }

    function _removeRole(uint256 roleId) internal {
        // check role exists
        _checkRoleExists(roleId);

        // get current entitlements
        IEntitlement[] memory currentEntitlements = _getEntitlementsByRole(roleId);
        uint256 currentEntitlementsLen = currentEntitlements.length;

        RolesStorage.Layout storage rs = RolesStorage.layout();

        rs.roles.remove(roleId);
        delete rs.roleById[roleId];
        rs.roleById[roleId].name = "";
        rs.roleById[roleId].isImmutable = false;

        uint256 permissionLen = rs.roleById[roleId].permissions.length();
        uint256 entitlementLen = rs.roleById[roleId].entitlements.length();

        for (uint256 i = 0; i < permissionLen; ) {
            rs.roleById[roleId].permissions.remove(rs.roleById[roleId].permissions.at(i));
            unchecked {
                i++;
            }
        }

        for (uint256 i = 0; i < entitlementLen; ) {
            rs.roleById[roleId].entitlements.remove(rs.roleById[roleId].entitlements.at(i));
            unchecked {
                i++;
            }
        }

        bytes32[] memory channelIds = ChannelService.getChannelIdsByRole(roleId);
        uint256 channelIdsLen = channelIds.length;

        // remove role from channels
        for (uint256 i = 0; i < channelIdsLen; ) {
            ChannelService.removeRoleFromChannel(channelIds[i], roleId);

            unchecked {
                i++;
            }
        }

        // remove role from entitlements
        for (uint256 i = 0; i < currentEntitlementsLen; ) {
            EntitlementsManagerService.proxyRemoveRoleFromEntitlement(
                address(currentEntitlements[i]),
                roleId
            );

            unchecked {
                i++;
            }
        }

        emit RoleRemoved(msg.sender, roleId);
    }

    // =============================================================
    // Channel Permissions
    // =============================================================
    function _getChannelPermissionOverrides(
        uint256 roleId,
        bytes32 channelId
    ) internal view returns (string[] memory permissions) {
        // check role exists
        _checkRoleExists(roleId);

        // check channel exists
        ChannelService.checkChannelExists(channelId);

        return RolesStorage.layout().permissionOverridesByRole[roleId][channelId].values();
    }

    function _setChannelPermissionOverrides(
        uint256 roleId,
        bytes32 channelId,
        string[] memory permissions
    ) internal {
        ChannelService.checkChannelExists(channelId);

        // check role exists
        _checkRoleExists(roleId);

        RolesStorage.Layout storage rs = RolesStorage.layout();

        rs.channelOverridesByRole[roleId].add(channelId);

        StringSet.Set storage permissionsSet = rs.permissionOverridesByRole[roleId][channelId];

        // remove current channel permissions if any
        if (permissionsSet.length() > 0) {
            string[] memory currentPermissions = permissionsSet.values();
            uint256 currentPermissionsLen = currentPermissions.length;
            for (uint256 i = 0; i < currentPermissionsLen; i++) {
                permissionsSet.remove(currentPermissions[i]);
            }
        }

        // check if new permissions are not empty then add them
        uint256 permissionsLen = permissions.length;
        if (permissionsLen > 0) {
            for (uint256 i = 0; i < permissionsLen; i++) {
                _checkEmptyString(permissions[i]);
                permissionsSet.add(permissions[i]);
            }
        } else {
            _clearChannelPermissionOverrides(roleId, channelId);
        }

        emit PermissionsAddedToChannelRole(msg.sender, roleId, channelId);
    }

    function _clearChannelPermissionOverrides(uint256 roleId, bytes32 channelId) internal {
        // check role exists
        _checkRoleExists(roleId);

        // check channel exists
        ChannelService.checkChannelExists(channelId);

        RolesStorage.Layout storage rs = RolesStorage.layout();
        StringSet.Set storage permissionsSet = rs.permissionOverridesByRole[roleId][channelId];

        // get current permissions
        string[] memory currentPermissions = permissionsSet.values();
        uint256 currentPermissionsLen = currentPermissions.length;
        for (uint256 i = 0; i < currentPermissionsLen; i++) {
            permissionsSet.remove(currentPermissions[i]);
        }

        rs.channelOverridesByRole[roleId].remove(channelId);

        emit PermissionsRemovedFromChannelRole(msg.sender, roleId, channelId);
    }

    // =============================================================
    //                           Internals
    // =============================================================
    function _getNextRoleId() internal view returns (uint256 roleId) {
        RolesStorage.Layout storage rs = RolesStorage.layout();
        return rs.roleCount + 1;
    }

    function _checkRoleExists(uint256 roleId) internal view {
        // check that role exists
        if (!RolesStorage.layout().roles.contains(roleId)) {
            revert Roles__RoleDoesNotExist();
        }
    }

    function _getRole(
        uint256 roleId
    )
        internal
        view
        returns (
            string memory name,
            bool isImmutable,
            string[] memory permissions,
            IEntitlement[] memory entitlements
        )
    {
        RolesStorage.Layout storage rs = RolesStorage.layout();

        name = rs.roleById[roleId].name;
        isImmutable = rs.roleById[roleId].isImmutable;
        permissions = rs.roleById[roleId].permissions.values();
        entitlements = _getEntitlementsByRole(roleId);
    }

    function _getRoleIds() internal view returns (uint256[] memory roleIds) {
        return RolesStorage.layout().roles.values();
    }

    function _getEntitlementsByRole(uint256 roleId) internal view returns (IEntitlement[] memory) {
        EnumerableSet.AddressSet storage entitlements = RolesStorage
            .layout()
            .roleById[roleId]
            .entitlements;

        uint256 entitlementLen = entitlements.length();

        IEntitlement[] memory entitlementsArray = new IEntitlement[](entitlementLen);

        for (uint256 i = 0; i < entitlementLen; i++) {
            address entitlementAddress = entitlements.at(i);
            entitlementsArray[i] = IEntitlement(entitlementAddress);
        }

        return entitlementsArray;
    }

    function _addRole(
        string memory roleName,
        bool isImmutable,
        string[] memory permissions,
        IEntitlement[] memory entitlements
    ) internal returns (uint256 roleId) {
        RolesStorage.Layout storage rs = RolesStorage.layout();

        roleId = ++rs.roleCount;

        rs.roles.add(roleId);
        rs.roleById[roleId].name = roleName;
        rs.roleById[roleId].isImmutable = isImmutable;

        _addPermissionsToRole(roleId, permissions);

        for (uint256 i = 0; i < entitlements.length; i++) {
            // if entitlement is empty, skip
            if (address(entitlements[i]) == address(0)) {
                revert Roles__InvalidEntitlementAddress();
            }

            rs.roleById[roleId].entitlements.add(address(entitlements[i]));
        }
    }

    // =============================================================
    //                    Permission Management
    // =============================================================

    function _addPermissionsToRole(uint256 roleId, string[] memory permissions) internal {
        // check role exists
        _checkRoleExists(roleId);

        RolesStorage.Layout storage rs = RolesStorage.layout();

        uint256 permissionLen = permissions.length;

        for (uint256 i = 0; i < permissionLen; ) {
            // if permission is empty, revert
            _checkEmptyString(permissions[i]);

            // if permission already exists, revert
            if (rs.roleById[roleId].permissions.contains(permissions[i])) {
                revert Roles__PermissionAlreadyExists();
            }

            rs.roleById[roleId].permissions.add(permissions[i]);

            unchecked {
                i++;
            }
        }
    }

    function _removePermissionsFromRole(uint256 roleId, string[] memory permissions) internal {
        // check role exists
        _checkRoleExists(roleId);

        // check permissions
        RolesStorage.Layout storage rs = RolesStorage.layout();

        uint256 permissionLen = permissions.length;

        for (uint256 i = 0; i < permissionLen; ) {
            // if permission is empty, revert
            _checkEmptyString(permissions[i]);

            RolesStorage.Role storage role = rs.roleById[roleId];

            if (!role.permissions.contains(permissions[i])) {
                revert Roles__PermissionDoesNotExist();
            }

            role.permissions.remove(permissions[i]);

            unchecked {
                i++;
            }
        }
    }

    function _getPermissionsByRoleId(
        uint256 roleId
    ) internal view returns (string[] memory permissions) {
        (, , permissions, ) = _getRole(roleId);
    }

    // =============================================================
    //                  Role - Entitlement Management
    // =============================================================

    function _addRoleToEntitlement(uint256 roleId, CreateEntitlement memory entitlement) internal {
        // check role exists
        _checkRoleExists(roleId);

        // check entitlements exists
        EntitlementsManagerService.checkEntitlement(address(entitlement.module));

        // add entitlement to role
        _addEntitlementToRole(roleId, address(entitlement.module));

        // set entitlement to role
        EntitlementsManagerService.proxyAddRoleToEntitlement(
            address(entitlement.module),
            roleId,
            entitlement.data
        );
    }

    function _removeRoleFromEntitlement(
        uint256 roleId,
        CreateEntitlement memory entitlement
    ) internal {
        // check role exists
        _checkRoleExists(roleId);

        // check entitlements exists
        EntitlementsManagerService.checkEntitlement(address(entitlement.module));

        // remove entitlement from role
        _removeEntitlementFromRole(roleId, address(entitlement.module));

        // set entitlement to role
        EntitlementsManagerService.proxyRemoveRoleFromEntitlement(
            address(entitlement.module),
            roleId
        );
    }

    function _checkEmptyString(string memory str) internal pure {
        if (bytes(str).length == 0) {
            revert Roles__InvalidPermission();
        }
    }

    function _removeEntitlementFromRole(uint256 roleId, address entitlement) internal {
        RolesStorage.Role storage role = RolesStorage.layout().roleById[roleId];

        if (!role.entitlements.contains(entitlement)) {
            revert Roles__EntitlementDoesNotExist();
        }

        role.entitlements.remove(entitlement);
    }

    function _addEntitlementToRole(uint256 roleId, address entitlement) internal {
        RolesStorage.Role storage role = RolesStorage.layout().roleById[roleId];

        if (role.entitlements.contains(entitlement)) {
            revert Roles__EntitlementAlreadyExists();
        }

        role.entitlements.add(entitlement);
    }
}
