import {
    bigIntToBytes,
    bin_equal,
    bin_fromHexString,
    bin_toHexString,
    check,
} from '@towns-protocol/dlog'
import { isDefined, assert, hasElements } from './check'
import {
    Envelope,
    EventRef,
    StreamEvent,
    Err,
    Miniblock,
    StreamAndCookie,
    Tags,
    PlainMessage,
    Snapshot,
    StreamEventSchema,
    EnvelopeSchema,
    StreamAndCookieSchema,
    SyncCookieSchema,
    EventRefSchema,
    SnapshotSchema,
} from '@towns-protocol/proto'
import { assertBytes } from 'ethereum-cryptography/utils'
import { recoverPublicKey, signSync, verify } from 'ethereum-cryptography/secp256k1'
import { genIdBlob, streamIdAsBytes, streamIdAsString, userIdFromAddress } from './id'
import {
    ParsedEvent,
    ParsedMiniblock,
    ParsedSnapshot,
    ParsedStreamAndCookie,
    ParsedStreamResponse,
} from './types'
import { SignerContext, checkDelegateSig } from './signerContext'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { createHash } from 'crypto'
import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { eventIdsFromSnapshot } from './persistenceStore'

export interface UnpackEnvelopeOpts {
    // the client recreates the hash from the event bytes in the envelope
    // and compares it to the hash in the envelope.
    // if this is true, we skip the hash check
    // this operation is cheap, but it can be useful to skip if you can trust the source of the envelope
    disableHashValidation?: boolean
    // the client derives the creator address from the signature in the envelope
    // and compares it to the creator address on the event.
    // if this is true, we skip the signature check
    // this operation is relatively expensive, and can be evaluated later
    disableSignatureValidation?: boolean
}

export const _impl_makeEvent_impl_ = async (
    context: SignerContext,
    payload: PlainMessage<StreamEvent>['payload'],
    prevMiniblockHash?: Uint8Array,
    tags?: PlainMessage<Tags>,
): Promise<Envelope> => {
    const streamEvent = create(StreamEventSchema, {
        creatorAddress: context.creatorAddress,
        salt: genIdBlob(),
        prevMiniblockHash,
        payload,
        createdAtEpochMs: BigInt(Date.now()),
        tags,
    })
    if (context.delegateSig !== undefined) {
        streamEvent.delegateSig = context.delegateSig
        streamEvent.delegateExpiryEpochMs = context.delegateExpiryEpochMs ?? 0n
    }

    const event = toBinary(StreamEventSchema, streamEvent)
    const hash = riverHash(event)
    const signature = await riverSign(hash, context.signerPrivateKey())

    return create(EnvelopeSchema, { hash, signature, event })
}

export const makeEvent = async (
    context: SignerContext,
    payload: PlainMessage<StreamEvent>['payload'],
    prevMiniblockHash?: Uint8Array,
    tags?: PlainMessage<Tags>,
): Promise<Envelope> => {
    // const pl: Payload = payload instanceof Payload ? payload : new Payload(payload)
    const pl = payload // todo check this
    check(isDefined(pl), "Payload can't be undefined", Err.BAD_PAYLOAD)
    check(isDefined(pl.case), "Payload can't be empty", Err.BAD_PAYLOAD)
    check(isDefined(pl.value), "Payload value can't be empty", Err.BAD_PAYLOAD)
    check(isDefined(pl.value.content), "Payload content can't be empty", Err.BAD_PAYLOAD)
    check(isDefined(pl.value.content.case), "Payload content case can't be empty", Err.BAD_PAYLOAD)

    if (prevMiniblockHash) {
        check(
            prevMiniblockHash.length === 32,
            `prevMiniblockHash should be 32 bytes, got ${prevMiniblockHash.length}`,
            Err.BAD_HASH_FORMAT,
        )
    }

    return _impl_makeEvent_impl_(context, pl, prevMiniblockHash, tags)
}

export const makeEvents = async (
    context: SignerContext,
    payloads: PlainMessage<StreamEvent>['payload'][],
    prevMiniblockHash?: Uint8Array,
): Promise<Envelope[]> => {
    const events: Envelope[] = []
    for (const payload of payloads) {
        const event = await makeEvent(context, payload, prevMiniblockHash)
        events.push(event)
    }
    return events
}

export const unpackStream = async (
    stream: StreamAndCookie | undefined,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedStreamResponse> => {
    assert(stream !== undefined, 'bad stream')
    const streamAndCookie = await unpackStreamAndCookie(stream, opts)
    assert(
        stream.miniblocks.length > 0,
        `bad stream: no blocks ${streamIdAsString(streamAndCookie.nextSyncCookie.streamId)}`,
    )

    let snapshot = streamAndCookie.miniblocks[0].header.snapshot
    if (snapshot === undefined) {
        snapshot = streamAndCookie.snapshot?.snapshot
    }
    assert(
        snapshot !== undefined,
        `bad block: snapshot is undefined ${streamIdAsString(
            streamAndCookie.nextSyncCookie.streamId,
        )}`,
    )
    const prevSnapshotMiniblockNum = streamAndCookie.miniblocks[0].header.prevSnapshotMiniblockNum
    const eventIds = [
        ...streamAndCookie.miniblocks.flatMap(
            (mb) => mb.events.map((e) => e.hashStr),
            streamAndCookie.events.map((e) => e.hashStr),
        ),
        ...eventIdsFromSnapshot(snapshot),
    ]

    return {
        streamAndCookie,
        snapshot,
        prevSnapshotMiniblockNum,
        eventIds,
    }
}

export const unpackStreamEx = async (
    miniblocks: Miniblock[],
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedStreamResponse> => {
    const streamAndCookie: StreamAndCookie = create(StreamAndCookieSchema, {})
    streamAndCookie.events = []
    streamAndCookie.miniblocks = miniblocks
    // We don't need to set a valid nextSyncCookie here, as we are currently using getStreamEx only
    // for fetching media streams, and the result does not return a nextSyncCookie. However, it does
    // need to be non-null to avoid runtime errors when unpacking the stream into a StreamStateView,
    // which parses content by type.
    streamAndCookie.nextSyncCookie = create(SyncCookieSchema)
    return unpackStream(streamAndCookie, opts)
}

export const unpackStreamAndCookie = async (
    streamAndCookie: StreamAndCookie,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedStreamAndCookie> => {
    assert(streamAndCookie.nextSyncCookie !== undefined, 'bad stream: no cookie')
    const miniblocks = await Promise.all(
        streamAndCookie.miniblocks.map(async (mb) => await unpackMiniblock(mb, opts)),
    )
    return {
        events: await unpackEnvelopes(streamAndCookie.events, opts),
        nextSyncCookie: streamAndCookie.nextSyncCookie,
        miniblocks: miniblocks,
        snapshot: streamAndCookie.snapshot
            ? await unpackSnapshot(miniblocks[0], streamAndCookie.snapshot, opts)
            : undefined,
    }
}

// returns all events, the header event, snapshot, and pointer to header content
export const unpackMiniblock = async (
    miniblock: Miniblock,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedMiniblock> => {
    check(isDefined(miniblock.header), 'Miniblock header is not set')
    const header = await unpackEnvelope(miniblock.header, opts)
    check(
        header.event.payload.case === 'miniblockHeader',
        `bad miniblock header: wrong case received: ${header.event.payload.case}`,
    )
    const events = await unpackEnvelopes(miniblock.events, opts)
    return {
        hash: miniblock.header.hash,
        header: header.event.payload.value,
        events: [...events, header],
    }
}

export const unpackEnvelope = async (
    envelope: Envelope,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedEvent> => {
    check(hasElements(envelope.event), 'Event base is not set', Err.BAD_EVENT)
    check(hasElements(envelope.hash), 'Event hash is not set', Err.BAD_EVENT)
    check(hasElements(envelope.signature), 'Event signature is not set', Err.BAD_EVENT)

    const event = fromBinary(StreamEventSchema, envelope.event)
    let hash = envelope.hash

    const doCheckEventHash = opts?.disableHashValidation !== true
    if (doCheckEventHash) {
        hash = riverHash(envelope.event)
        check(bin_equal(hash, envelope.hash), 'Event id is not valid', Err.BAD_EVENT_ID)
    }

    const doCheckEventSignature = opts?.disableSignatureValidation !== true
    if (doCheckEventSignature) {
        checkEventSignature(event, hash, envelope.signature)
    }

    return makeParsedEvent(event, envelope.hash, envelope.signature)
}

export const unpackSnapshot = async (
    miniblock: ParsedMiniblock,
    snapshot: Envelope,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedSnapshot> => {
    check(hasElements(snapshot.event), 'Snapshot base is not set', Err.BAD_EVENT)
    check(hasElements(snapshot.hash), 'Snapshot hash is not set', Err.BAD_EVENT)
    check(hasElements(snapshot.signature), 'Snapshot signature is not set', Err.BAD_EVENT)

    // make sure the given snapshot corresponds to the miniblock
    check(
        bin_equal(miniblock.header.snapshotHash, snapshot.hash),
        'Snapshot hash does not match miniblock snapshot hash',
        Err.BAD_EVENT_ID,
    )

    // check snapshot hash
    if (opts?.disableHashValidation !== true) {
        const hash = riverSnapshotHash(snapshot.event)
        check(bin_equal(hash, snapshot.hash), 'Snapshot hash is not valid', Err.BAD_EVENT_ID)
    }

    if (opts?.disableSignatureValidation !== true) {
        // header event contains the creatorAddress of the snapshot.
        const headerEvent = miniblock.events.at(-1)
        check(headerEvent !== undefined, 'Miniblock header event not found', Err.BAD_EVENT)
        checkEventSignature(headerEvent.event, snapshot.hash, snapshot.signature)
    }

    return makeParsedSnapshot(
        fromBinary(SnapshotSchema, snapshot.event),
        snapshot.hash,
        snapshot.signature,
    )
}

export function checkEventSignature(
    event: {
        creatorAddress: Uint8Array
        delegateSig: Uint8Array
        delegateExpiryEpochMs: bigint
    },
    hash: Uint8Array,
    signature: Uint8Array,
) {
    const recoveredPubKey = riverRecoverPubKey(hash, signature)

    if (!hasElements(event.delegateSig)) {
        const address = publicKeyToAddress(recoveredPubKey)
        check(
            bin_equal(address, event.creatorAddress),
            'Event signature is not valid',
            Err.BAD_EVENT_SIGNATURE,
        )
    } else {
        checkDelegateSig({
            delegatePubKey: recoveredPubKey,
            creatorAddress: event.creatorAddress,
            delegateSig: event.delegateSig,
            expiryEpochMs: event.delegateExpiryEpochMs,
        })
    }
}

export function makeParsedEvent(
    event: StreamEvent,
    hash: Uint8Array | undefined,
    signature: Uint8Array | undefined,
) {
    hash = hash ?? riverHash(toBinary(StreamEventSchema, event))
    return {
        event,
        hash,
        hashStr: bin_toHexString(hash),
        signature,
        creatorUserId: userIdFromAddress(event.creatorAddress),
    } satisfies ParsedEvent
}

export function makeParsedSnapshot(
    snapshot: Snapshot,
    hash: Uint8Array | undefined,
    signature: Uint8Array | undefined,
) {
    hash = hash ?? riverSnapshotHash(toBinary(SnapshotSchema, snapshot))
    return {
        snapshot,
        hash,
        hashStr: bin_toHexString(hash),
        signature,
    } satisfies ParsedSnapshot
}

export const unpackEnvelopes = async (
    event: Envelope[],
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedEvent[]> => {
    const ret: ParsedEvent[] = []
    //let prevEventHash: Uint8Array | undefined = undefined
    for (const e of event) {
        // TODO: this handling of prevEventHash is not correct,
        // hashes should be checked against all preceding events in the stream.
        ret.push(await unpackEnvelope(e, opts))
        //prevEventHash = e.hash!
    }
    return ret
}

// First unpacks miniblocks, including header events, then unpacks events from the minipool
export const unpackStreamEnvelopes = async (
    stream: StreamAndCookie,
    opts: UnpackEnvelopeOpts | undefined,
): Promise<ParsedEvent[]> => {
    const ret: ParsedEvent[] = []

    for (const mb of stream.miniblocks) {
        ret.push(...(await unpackEnvelopes(mb.events, opts)))
        ret.push(await unpackEnvelope(mb.header!, opts))
    }

    ret.push(...(await unpackEnvelopes(stream.events, opts)))
    return ret
}

export const makeEventRef = (streamId: string | Uint8Array, event: Envelope): EventRef => {
    return create(EventRefSchema, {
        streamId: streamIdAsBytes(streamId),
        hash: event.hash,
        signature: event.signature,
    })
}

// Create hash header as Uint8Array from string 'CSBLANCA'
const HASH_HEADER = new Uint8Array([67, 83, 66, 76, 65, 78, 67, 65])
// Create hash separator as Uint8Array from string 'ABCDEFG>'
const HASH_SEPARATOR = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 62])
// Create hash footer as Uint8Array from string '<GFEDCBA'
const HASH_FOOTER = new Uint8Array([60, 71, 70, 69, 68, 67, 66, 65])
// Header for delegate signature 'RIVERSIG'
const RIVER_SIG_HEADER = new Uint8Array([82, 73, 86, 69, 82, 83, 73, 71])
// Create hash header as Uint8Array from string 'SNAPSHOT'
const SNAPSHOT_HEADER = new Uint8Array([83, 78, 65, 80, 83, 72, 79, 84])

function numberToUint8Array64LE(num: number): Uint8Array {
    const result = new Uint8Array(8)
    for (let i = 0; num != 0; i++, num = num >>> 8) {
        result[i] = num & 0xff
    }
    return result
}

function bigintToUint8Array64(num: bigint, endianMode: 'bigEndian' | 'littleEndian'): Uint8Array {
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)
    view.setBigInt64(0, num, endianMode === 'littleEndian') // true for little endian
    return new Uint8Array(buffer)
}

function pushByteToUint8Array(arr: Uint8Array, byte: number): Uint8Array {
    const ret = new Uint8Array(arr.length + 1)
    ret.set(arr)
    ret[arr.length] = byte
    return ret
}

function checkSignature(signature: Uint8Array) {
    assertBytes(signature, 65)
}

function checkHash(hash: Uint8Array) {
    assertBytes(hash, 32)
}

export function riverHash(data: Uint8Array): Uint8Array {
    assertBytes(data)
    const hasher = keccak256.create()
    hasher.update(HASH_HEADER)
    hasher.update(numberToUint8Array64LE(data.length))
    hasher.update(HASH_SEPARATOR)
    hasher.update(data)
    hasher.update(HASH_FOOTER)
    return hasher.digest()
}

export function riverSnapshotHash(data: Uint8Array): Uint8Array {
    assertBytes(data)
    const hasher = keccak256.create()
    hasher.update(SNAPSHOT_HEADER)
    hasher.update(numberToUint8Array64LE(data.length))
    hasher.update(HASH_SEPARATOR)
    hasher.update(data)
    hasher.update(HASH_FOOTER)
    return hasher.digest()
}

export function riverDelegateHashSrc(
    devicePublicKey: Uint8Array,
    expiryEpochMs: bigint,
): Uint8Array {
    assertBytes(devicePublicKey)
    check(expiryEpochMs >= 0, 'Expiry should be positive')
    check(devicePublicKey.length === 64 || devicePublicKey.length === 65, 'Bad public key')
    const expiryBytes = bigintToUint8Array64(expiryEpochMs, 'littleEndian')
    const retVal = new Uint8Array(
        RIVER_SIG_HEADER.length + devicePublicKey.length + expiryBytes.length,
    )
    retVal.set(RIVER_SIG_HEADER)
    retVal.set(devicePublicKey, RIVER_SIG_HEADER.length)
    retVal.set(expiryBytes, RIVER_SIG_HEADER.length + devicePublicKey.length)
    return retVal
}

export function notificationServiceHash(
    userId: Uint8Array,
    expiration: bigint, // unix seconds
    challenge: Uint8Array,
) {
    const PREFIX = 'NS_AUTH:'
    const prefixBytes = new TextEncoder().encode(PREFIX)
    const expirationBytes = bigIntToBytes(expiration)
    // aellis - i don't understand why we need to slice here, the go and ios code both truncate the leading 0's
    check(userId.length === 20, 'User ID should be 20 bytes')
    check(challenge.length === 16, 'Challenge should be 16 bytes')
    return createHash('sha256')
        .update(prefixBytes)
        .update(userId)
        .update(expirationBytes)
        .update(challenge)
        .digest()
}

export async function riverSign(
    hash: Uint8Array,
    privateKey: Uint8Array | string,
): Promise<Uint8Array> {
    checkHash(hash)
    // TODO(HNT-1380): why async sign doesn't work in node? Use async sign in the browser, sync sign in node?
    const [sig, recovery] = signSync(hash, privateKey, { recovered: true, der: false })
    return pushByteToUint8Array(sig, recovery)
}

export function riverVerifySignature(
    hash: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array | string,
): boolean {
    checkHash(hash)
    checkSignature(signature)
    return verify(signature.slice(0, 64), hash, publicKey)
}

export function riverRecoverPubKey(hash: Uint8Array, signature: Uint8Array): Uint8Array {
    checkHash(hash)
    checkSignature(signature)
    return recoverPublicKey(hash, signature.slice(0, 64), signature[64])
}

export function publicKeyToAddress(publicKey: Uint8Array): Uint8Array {
    assertBytes(publicKey, 64, 65)
    if (publicKey.length === 65) {
        publicKey = publicKey.slice(1)
    }
    return keccak256(publicKey).slice(-20)
}

export function publicKeyToUint8Array(publicKey: string): Uint8Array {
    // Uncompressed public key in string form should start with '0x04'.
    check(
        typeof publicKey === 'string' && publicKey.startsWith('0x04') && publicKey.length === 132,
        'Bad public key',
        Err.BAD_PUBLIC_KEY,
    )
    return bin_fromHexString(publicKey)
}
