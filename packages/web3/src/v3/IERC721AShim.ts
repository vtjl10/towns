import {
    IERC721A as DevContract,
    IERC721AInterface as DevInterface,
} from '@towns-protocol/generated/dev/typings/IERC721A'

import DevAbi from '@towns-protocol/generated/dev/abis/IERC721A.abi.json' assert { type: 'json' }

import { ethers } from 'ethers'
import { BaseContractShim } from './BaseContractShim'

export class IERC721AShim extends BaseContractShim<DevContract, DevInterface> {
    constructor(address: string, provider: ethers.providers.Provider | undefined) {
        super(address, provider, DevAbi)
    }
}
