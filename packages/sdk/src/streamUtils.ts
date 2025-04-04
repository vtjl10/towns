import {
    PersistedEvent,
    PersistedEventSchema,
    PersistedMiniblock,
    PersistedMiniblockSchema,
    PersistedSyncedStream,
    SyncCookie,
} from '@towns-protocol/proto'
import { ParsedEvent, ParsedMiniblock } from './types'
import { bin_toHexString } from '@towns-protocol/dlog'
import { create } from '@bufbuild/protobuf'
import { isDefined, logNever } from './check'

export interface ParsedPersistedSyncedStream {
    streamId: string
    syncCookie: SyncCookie
    lastSnapshotMiniblockNum: bigint
    minipoolEvents: ParsedEvent[]
    lastMiniblockNum: bigint
}

export function isPersistedEvent(event: ParsedEvent, direction: 'forward' | 'backward'): boolean {
    if (!event.event) {
        return false
    }

    switch (event.event.payload.case) {
        case 'channelPayload':
            return true
        case 'dmChannelPayload':
            return true
        case 'gdmChannelPayload':
            return true
        case 'mediaPayload':
            return true
        case 'userPayload':
            switch (event.event.payload.value.content.case) {
                case 'blockchainTransaction':
                    return true
                case 'receivedBlockchainTransaction':
                    return true
                default:
                    return direction === 'forward' ? true : false
            }
        case 'userSettingsPayload':
            return direction === 'forward' ? true : false
        case 'miniblockHeader':
            return true
        case 'userMetadataPayload':
            return direction === 'forward' ? true : false
        case 'memberPayload': {
            switch (event.event.payload.value.content.case) {
                case 'keySolicitation':
                    return direction === 'forward' ? true : false
                case 'keyFulfillment':
                    return direction === 'forward' ? true : false
                case 'memberBlockchainTransaction':
                    return true
                case undefined:
                    return false
                default:
                    return direction === 'forward' ? true : false
            }
        }
        case 'spacePayload':
            return direction === 'forward' ? true : false
        case 'userInboxPayload':
            return direction === 'forward' ? true : false
        case undefined:
            return false
        default:
            logNever(event.event.payload, `unsupported event payload ${event.event.payload}`)
            return false
    }
}

export function persistedEventToParsedEvent(event: PersistedEvent): ParsedEvent | undefined {
    if (!event.event) {
        return undefined
    }
    return {
        event: event.event,
        hash: event.hash,
        hashStr: bin_toHexString(event.hash),
        signature: event.signature,
        creatorUserId: event.creatorUserId,
    }
}

export function persistedMiniblockToParsedMiniblock(
    miniblock: PersistedMiniblock,
): ParsedMiniblock | undefined {
    if (!miniblock.header) {
        return undefined
    }
    return {
        hash: miniblock.hash,
        header: miniblock.header,
        events: miniblock.events.map(persistedEventToParsedEvent).filter(isDefined),
    }
}

export function parsedMiniblockToPersistedMiniblock(
    miniblock: ParsedMiniblock,
    direction: 'forward' | 'backward',
) {
    if (direction === 'backward') {
        miniblock.header.snapshot = undefined
    }
    return create(PersistedMiniblockSchema, {
        hash: miniblock.hash,
        header: miniblock.header,
        events: miniblock.events
            .filter((event) => isPersistedEvent(event, direction))
            .map(parsedEventToPersistedEvent),
    })
}

function parsedEventToPersistedEvent(event: ParsedEvent) {
    return create(PersistedEventSchema, {
        event: event.event,
        hash: event.hash,
        signature: event.signature,
        creatorUserId: event.creatorUserId,
    })
}

export function persistedSyncedStreamToParsedSyncedStream(
    streamId: string,
    stream: PersistedSyncedStream,
): ParsedPersistedSyncedStream | undefined {
    if (!stream.syncCookie) {
        return undefined
    }
    return {
        streamId,
        syncCookie: stream.syncCookie,
        lastSnapshotMiniblockNum: stream.lastSnapshotMiniblockNum,
        minipoolEvents: stream.minipoolEvents.map(persistedEventToParsedEvent).filter(isDefined),
        lastMiniblockNum: stream.lastMiniblockNum,
    }
}
