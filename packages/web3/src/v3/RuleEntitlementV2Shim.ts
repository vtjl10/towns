import {
    IRuleEntitlementV2 as LocalhostContract,
    IRuleEntitlementBase as LocalhostBase,
    IRuleEntitlementV2Interface as LocalhostInterface,
} from '@towns-protocol/generated/dev/typings/IRuleEntitlement.sol/IRuleEntitlementV2'

import LocalhostAbi from '@towns-protocol/generated/dev/abis/IRuleEntitlementV2.abi.json' assert { type: 'json' }

import { BaseContractShim } from './BaseContractShim'
import { BigNumberish, ethers } from 'ethers'
import { EntitlementModuleType, EntitlementModule } from '../ContractTypes'
import { dlogger } from '@towns-protocol/dlog'
const logger = dlogger('csb:SpaceDapp:debug')

export class RuleEntitlementV2Shim
    extends BaseContractShim<LocalhostContract, LocalhostInterface>
    implements EntitlementModule
{
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, LocalhostAbi)
    }

    public get moduleType(): EntitlementModuleType {
        return EntitlementModuleType.RuleEntitlementV2
    }

    public async getRoleEntitlement(
        roleId: BigNumberish,
    ): Promise<LocalhostBase.RuleDataV2Struct | null> {
        if (roleId === 0) {
            return {
                operations: [],
                checkOperations: [],
                logicalOperations: [],
            }
        }
        return this.read.getRuleDataV2(roleId)
    }

    public decodeGetRuleData(entitlementData: string): LocalhostBase.RuleDataV2Struct | undefined {
        try {
            const decoded = this.decodeFunctionResult(
                'getRuleDataV2',
                entitlementData,
            ) as unknown as LocalhostBase.RuleDataV2Struct[]

            if (decoded.length === 0) {
                logger.error('RuleEntitlementV2Shim No rule data', decoded)
                return undefined
            }
            return decoded.length > 0 ? decoded[0] : undefined
        } catch (error) {
            logger.error('RuleEntitlementV2Shim Error decoding RuleDataV2Struct', error)
        }
        return
    }
}
