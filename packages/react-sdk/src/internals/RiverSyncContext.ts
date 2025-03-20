'use client'
import { SyncAgent } from '@towns-protocol/sdk'
import { createContext } from 'react'

type SpaceContextProps = {
    syncAgent: SyncAgent | undefined
    setSyncAgent: (syncAgent: SyncAgent | undefined) => void
    config?: {
        onTokenExpired?: () => void
    }
}
export const RiverSyncContext = createContext<SpaceContextProps | undefined>(undefined)
