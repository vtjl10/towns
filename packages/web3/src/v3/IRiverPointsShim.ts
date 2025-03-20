import {
    ITownsPoints as DevContract,
    ITownsPointsInterface as DevInterface,
} from '@towns-protocol/generated/dev/typings/ITownsPoints'

import DevAbi from '@towns-protocol/generated/dev/abis/ITownsPoints.abi.json' assert { type: 'json' }

import { ethers } from 'ethers'
import { BaseContractShim } from './BaseContractShim'

export class IRiverPointsShim extends BaseContractShim<DevContract, DevInterface> {
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, DevAbi)
    }
}
