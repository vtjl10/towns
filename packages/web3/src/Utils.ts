import { ethers } from 'ethers'
import { PublicClient } from 'viem'
import { PricingModuleStruct } from './ContractTypes'
import { ISpaceDapp } from './ISpaceDapp'

export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const EVERYONE_ADDRESS = '0x0000000000000000000000000000000000000001'
export const MOCK_ADDRESS = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
export const MOCK_ADDRESS_2 = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbee2'
export const MOCK_ADDRESS_3 = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbee3'
export const MOCK_ADDRESS_4 = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbee4'
export const MOCK_ADDRESS_5 = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbee5'

export class NoEntitledWalletError extends Error {
    constructor() {
        super('No entitled wallet found')
        this.name = 'NoEntitledWalletError'

        // Setting the prototype is necessary for instanceof to work correctly
        // It ensures that instanceof NoEntitledWalletError returns true
        // This is because TypeScript's class syntax doesn't set up the prototype chain correctly for custom errors
        Object.setPrototypeOf(this, NoEntitledWalletError.prototype)
    }

    /**
     * throwIfRuntimeErrors is a helper function to process AggregateErrors emitted from Promise.any that may
     * contain promises rejected with NoEntitledWalletErrors, which represent an entitlement check that evaluates
     * to false, and not a true error condition. This method will filter out NoEntitledWalletErrors and throw an
     * AggregateError with the remaining errors, if any exist. Otherwise, it will simply return undefined.
     * @param error AggregateError
     * @returns undefined
     * @throws AggregateError
     */
    static throwIfRuntimeErrors = (error: AggregateError) => {
        const runtimeErrors = error.errors.filter(
            (e) => !(e instanceof NoEntitledWalletError),
        ) as Error[]
        if (runtimeErrors.length > 0) {
            throw new AggregateError(runtimeErrors)
        }
        return undefined
    }
}

export function isEthersProvider(
    provider: ethers.providers.Provider | PublicClient,
): provider is ethers.providers.Provider {
    return (
        typeof provider === 'object' &&
        provider !== null &&
        'getNetwork' in provider &&
        typeof provider.getNetwork === 'function'
    )
}

export function isPublicClient(
    provider: ethers.providers.Provider | PublicClient,
): provider is PublicClient {
    return (
        typeof provider === 'object' &&
        provider !== null &&
        'getNetwork' in provider &&
        typeof provider.getNetwork !== 'function'
    )
}

// River space stream ids are 64 characters long, and start with '10'
// incidentally this should also work if you just pass the space contract address with 0x prefix
export function SpaceAddressFromSpaceId(spaceId: string): string {
    return ethers.utils.getAddress(spaceId.slice(2, 42))
}

// River space stream ids are 64 characters long, and start with '10'
export function SpaceIdFromSpaceAddress(spaceAddress: string): string {
    return spaceAddress.toLowerCase().replace('0x', '10').padEnd(64, '0')
}

/**
 * Use this function in the default case of a exhaustive switch statement to ensure that all cases are handled.
 * Always throws JSON RPC error.
 * @param value Switch value
 * @param message Error message
 * @param code JSON RPC error code
 * @param data Optional data to include in the error
 */
export function checkNever(value: never, message?: string): never {
    throw new Error(message ?? `Unhandled switch value ${value}`)
}

/**
 * @deprecated
 * Use TIERED_PRICING_ORACLE_V2 or TIERED_PRICING_ORACLE_V3 instead
 * Yes, the correct value for this constant is "TieredLogPricingOracleV2"
 */
export const TIERED_PRICING_ORACLE = 'TieredLogPricingOracleV2'
export const TIERED_PRICING_ORACLE_V2 = 'TieredLogPricingOracleV2'
export const TIERED_PRICING_ORACLE_V3 = 'TieredLogPricingOracleV3'
export const FIXED_PRICING = 'FixedPricing'

export const getDynamicPricingModule = async (spaceDapp: ISpaceDapp | undefined) => {
    if (!spaceDapp) {
        throw new Error('getDynamicPricingModule: No spaceDapp')
    }
    const pricingModules = await spaceDapp.listPricingModules()
    const dynamicPricingModule = findDynamicPricingModule(pricingModules)
    if (!dynamicPricingModule) {
        throw new Error('getDynamicPricingModule: no dynamicPricingModule')
    }
    return dynamicPricingModule
}

export const getFixedPricingModule = async (spaceDapp: ISpaceDapp | undefined) => {
    if (!spaceDapp) {
        throw new Error('getFixedPricingModule: No spaceDapp')
    }
    const pricingModules = await spaceDapp.listPricingModules()
    const fixedPricingModule = findFixedPricingModule(pricingModules)
    if (!fixedPricingModule) {
        throw new Error('getFixedPricingModule: no fixedPricingModule')
    }
    return fixedPricingModule
}

export const findDynamicPricingModule = (pricingModules: PricingModuleStruct[]) =>
    pricingModules.find((module) => module.name === TIERED_PRICING_ORACLE_V3) ||
    pricingModules.find((module) => module.name === TIERED_PRICING_ORACLE_V2)

export const findFixedPricingModule = (pricingModules: PricingModuleStruct[]) =>
    pricingModules.find((module) => module.name === FIXED_PRICING)

export function stringifyChannelMetadataJSON({
    name,
    description,
}: {
    name: string
    description: string
}): string {
    return JSON.stringify({ name, description })
}

export function parseChannelMetadataJSON(metadataStr: string): {
    name: string
    description: string
} {
    try {
        const result = JSON.parse(metadataStr)
        if (
            typeof result === 'object' &&
            result !== null &&
            'name' in result &&
            'description' in result
        ) {
            return result as { name: string; description: string }
        }
    } catch (error) {
        /* empty */
    }
    return {
        name: metadataStr,
        description: '',
    }
}
