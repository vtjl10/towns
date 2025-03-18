import { create, toBinary, toJsonString } from '@bufbuild/protobuf'
import {
    Permission,
    SpaceAddressFromSpaceId,
    SpaceReviewAction,
    SpaceReviewEventObject,
} from '@river-build/web3'
import {
    PlainMessage,
    MembershipOp,
    ChannelOp,
    ChannelMessage_Post_Mention,
    ChannelMessage,
    ChannelMessage_Post,
    ChannelMessage_Post_Content_Text,
    ChannelMessage_Post_Content_Image,
    ChannelMessage_Post_Content_GM,
    ChannelMessage_Reaction,
    ChannelMessage_Redaction,
    StreamEvent,
    EncryptedData,
    StreamSettings,
    SpacePayload_ChannelSettings,
    FullyReadMarkers,
    FullyReadMarker,
    Envelope,
    Miniblock,
    Err,
    ChannelMessage_Post_Attachment,
    MemberPayload_Nft,
    CreateStreamRequest,
    AddEventResponse_Error,
    ChunkedMedia,
    UserBio,
    Tags,
    BlockchainTransaction,
    MiniblockHeader,
    GetStreamResponse,
    CreateStreamResponse,
    ChannelProperties,
    CreationCookie,
    BlockchainTransaction_TokenTransfer,
    BlockchainTransactionReceipt,
    BlockchainTransactionReceipt_LogSchema,
    BlockchainTransactionReceiptSchema,
    ChannelPropertiesSchema,
    FullyReadMarkersSchema,
    ChunkedMediaSchema,
    EncryptedDataSchema,
    UserBioSchema,
    MemberPayload_NftSchema,
    ChannelMessageSchema,
    SolanaBlockchainTransactionReceiptSchema,
    SolanaBlockchainTransactionReceipt,
    SessionKeysSchema,
    EnvelopeSchema,
} from '@river-build/proto'
import {
    bin_fromHexString,
    bin_toHexString,
    shortenHexString,
    DLogger,
    check,
    dlog,
    dlogError,
    bin_fromString,
} from '@river-build/dlog'
import {
    AES_GCM_DERIVED_ALGORITHM,
    BaseDecryptionExtensions,
    CryptoStore,
    DecryptionEvents,
    EntitlementsDelegate,
    GroupEncryptionAlgorithmId,
    GroupEncryptionCrypto,
    GroupEncryptionSession,
    IGroupEncryptionClient,
    UserDevice,
    UserDeviceCollection,
    makeSessionKeys,
    type EncryptionDeviceInitOpts,
} from '@river-build/encryption'
import { getMaxTimeoutMs, StreamRpcClient, getMiniblocks } from './makeStreamRpcClient'
import { errorContains, getRpcErrorProperty } from './rpcInterceptors'
import { assert, isDefined } from './check'
import EventEmitter from 'events'
import TypedEmitter from 'typed-emitter'
import {
    isChannelStreamId,
    isDMChannelStreamId,
    isGDMChannelStreamId,
    isSpaceStreamId,
    makeDMStreamId,
    makeUniqueGDMChannelStreamId,
    makeUniqueMediaStreamId,
    makeUserMetadataStreamId,
    makeUserSettingsStreamId,
    makeUserStreamId,
    makeUserInboxStreamId,
    userIdFromAddress,
    addressFromUserId,
    streamIdAsBytes,
    streamIdAsString,
    makeSpaceStreamId,
    STREAM_ID_STRING_LENGTH,
    contractAddressFromSpaceId,
    isUserId,
} from './id'
import { makeEvent, unpackEnvelope, UnpackEnvelopeOpts, unpackStream, unpackStreamEx } from './sign'
import { StreamEvents } from './streamEvents'
import { IStreamStateView, StreamStateView } from './streamStateView'
import {
    make_UserMetadataPayload_Inception,
    make_ChannelPayload_Inception,
    make_ChannelPayload_Message,
    make_MemberPayload_Membership2,
    make_SpacePayload_Inception,
    make_UserPayload_Inception,
    make_SpacePayload_ChannelUpdate,
    make_UserSettingsPayload_FullyReadMarkers,
    make_UserSettingsPayload_UserBlock,
    make_UserSettingsPayload_Inception,
    make_MediaPayload_Inception,
    make_MediaPayload_Chunk,
    make_DMChannelPayload_Inception,
    make_DMChannelPayload_Message,
    make_GDMChannelPayload_Inception,
    make_GDMChannelPayload_Message,
    StreamTimelineEvent,
    make_UserInboxPayload_Ack,
    make_UserInboxPayload_Inception,
    make_UserMetadataPayload_EncryptionDevice,
    make_UserInboxPayload_GroupEncryptionSessions,
    ParsedStreamResponse,
    make_GDMChannelPayload_ChannelProperties,
    ParsedMiniblock,
    ClientInitStatus,
    make_UserPayload_UserMembershipAction,
    make_UserPayload_UserMembership,
    make_MemberPayload_DisplayName,
    make_MemberPayload_Username,
    getRefEventIdFromChannelMessage,
    make_ChannelPayload_Redaction,
    make_MemberPayload_EnsAddress,
    make_MemberPayload_Nft,
    make_MemberPayload_Pin,
    make_MemberPayload_Unpin,
    make_SpacePayload_UpdateChannelAutojoin,
    make_SpacePayload_UpdateChannelHideUserJoinLeaveEvents,
    make_SpacePayload_SpaceImage,
    make_UserMetadataPayload_ProfileImage,
    make_UserMetadataPayload_Bio,
    make_UserPayload_BlockchainTransaction,
    ContractReceipt,
    make_MemberPayload_EncryptionAlgorithm,
    SolanaTransactionReceipt,
    isSolanaTransactionReceipt,
} from './types'

import debug from 'debug'
import { Stream } from './stream'
import { getTime, usernameChecksum } from './utils'
import { isEncryptedContentKind, toDecryptedContent } from './encryptedContentTypes'
import { ClientDecryptionExtensions } from './clientDecryptionExtensions'
import {
    PersistenceStore,
    IPersistenceStore,
    StubPersistenceStore,
    LoadedStream,
} from './persistenceStore'
import { SyncedStreams } from './syncedStreams'
import { SyncState } from './syncedStreamsLoop'
import { SyncedStream } from './syncedStream'
import { SyncedStreamsExtension } from './syncedStreamsExtension'
import { SignerContext } from './signerContext'
import { decryptAESGCM, deriveKeyAndIV, encryptAESGCM, uint8ArrayToBase64 } from './crypto_utils'
import { makeTags, makeTipTags, makeTransferTags } from './tags'
import { TipEventObject } from '@river-build/generated/dev/typings/ITipping'

export type ClientEvents = StreamEvents & DecryptionEvents

export type ClientOptions = {
    persistenceStoreName?: string
    logNamespaceFilter?: string
    highPriorityStreamIds?: string[]
    unpackEnvelopeOpts?: UnpackEnvelopeOpts
    defaultGroupEncryptionAlgorithm?: GroupEncryptionAlgorithmId
    logId?: string
    streamOpts?: { useModifySync?: boolean }
}

type SendChannelMessageOptions = {
    beforeSendEventHook?: Promise<void>
    onLocalEventAppended?: (localId: string) => void
    disableTags?: boolean // if true, tags will not be added to the message
}

type SendBlockchainTransactionOptions = {
    disableTags?: boolean // if true, tags will not be added to the message
}

export class Client
    extends (EventEmitter as new () => TypedEmitter<ClientEvents>)
    implements IGroupEncryptionClient
{
    readonly signerContext: SignerContext
    readonly rpcClient: StreamRpcClient
    readonly userId: string
    readonly streams: SyncedStreams

    userStreamId?: string
    userSettingsStreamId?: string
    userMetadataStreamId?: string
    userInboxStreamId?: string

    private readonly logCall: DLogger
    private readonly logSync: DLogger
    private readonly logEmitFromStream: DLogger
    private readonly logEmitFromClient: DLogger
    private readonly logEvent: DLogger
    private readonly logError: DLogger
    private readonly logInfo: DLogger
    private readonly logDebug: DLogger

    public cryptoBackend?: GroupEncryptionCrypto
    public cryptoStore: CryptoStore

    private getStreamRequests: Map<string, Promise<StreamStateView>> = new Map()
    private getStreamExRequests: Map<string, Promise<StreamStateView>> = new Map()
    private initStreamRequests: Map<string, Promise<Stream>> = new Map()
    private getScrollbackRequests: Map<string, ReturnType<typeof this.scrollback>> = new Map()
    private creatingStreamIds = new Set<string>()
    private entitlementsDelegate: EntitlementsDelegate
    private decryptionExtensions?: BaseDecryptionExtensions
    private syncedStreamsExtensions?: SyncedStreamsExtension
    private persistenceStore: IPersistenceStore
    private defaultGroupEncryptionAlgorithm: GroupEncryptionAlgorithmId
    private logId: string

    constructor(
        signerContext: SignerContext,
        rpcClient: StreamRpcClient,
        cryptoStore: CryptoStore,
        entitlementsDelegate: EntitlementsDelegate,
        public opts?: ClientOptions,
    ) {
        super()
        if (opts?.logNamespaceFilter) {
            debug.enable(opts.logNamespaceFilter)
        }
        assert(
            isDefined(signerContext.creatorAddress) && signerContext.creatorAddress.length === 20,
            'creatorAddress must be set',
        )
        assert(
            isDefined(signerContext.signerPrivateKey()) &&
                signerContext.signerPrivateKey().length === 64,
            'signerPrivateKey must be set',
        )
        this.entitlementsDelegate = entitlementsDelegate
        this.signerContext = signerContext
        this.rpcClient = rpcClient
        this.userId = userIdFromAddress(signerContext.creatorAddress)
        this.defaultGroupEncryptionAlgorithm =
            opts?.defaultGroupEncryptionAlgorithm ??
            GroupEncryptionAlgorithmId.HybridGroupEncryption

        this.logId =
            opts?.logId ??
            shortenHexString(this.userId.startsWith('0x') ? this.userId.slice(2) : this.userId)

        this.logCall = dlog('csb:cl:call').extend(this.logId)
        this.logSync = dlog('csb:cl:sync').extend(this.logId)
        this.logEmitFromStream = dlog('csb:cl:stream').extend(this.logId)
        this.logEmitFromClient = dlog('csb:cl:emit').extend(this.logId)
        this.logEvent = dlog('csb:cl:event').extend(this.logId)
        this.logError = dlogError('csb:cl:error').extend(this.logId)
        this.logInfo = dlog('csb:cl:info', { defaultEnabled: true }).extend(this.logId)
        this.logDebug = dlog('csb:cl:debug').extend(this.logId)
        this.cryptoStore = cryptoStore

        if (opts?.persistenceStoreName) {
            this.persistenceStore = new PersistenceStore(opts.persistenceStoreName)
        } else {
            this.persistenceStore = new StubPersistenceStore()
        }

        this.streams = new SyncedStreams(
            this.userId,
            this.rpcClient,
            this,
            opts?.unpackEnvelopeOpts,
            this.logId,
            opts?.streamOpts,
        )
        this.syncedStreamsExtensions = new SyncedStreamsExtension(
            opts?.highPriorityStreamIds,
            {
                startSyncStreams: async () => {
                    this.streams.startSyncStreams()
                    this.decryptionExtensions?.start()
                },
                initStream: (streamId, allowGetStream, persistedData) =>
                    this.initStream(streamId, allowGetStream, persistedData),
                emitClientInitStatus: (status) => this.emit('clientInitStatusUpdated', status),
            },
            this.persistenceStore,
            this.logId,
        )

        this.logCall('new Client')
    }

    get streamSyncActive(): boolean {
        return this.streams.syncState === SyncState.Syncing
    }

    get clientInitStatus(): ClientInitStatus {
        check(this.syncedStreamsExtensions !== undefined, 'syncedStreamsExtensions must be set')
        return this.syncedStreamsExtensions.initStatus
    }

    get cryptoInitialized(): boolean {
        return this.cryptoBackend !== undefined
    }

    async stop(): Promise<void> {
        this.logCall('stop')
        await this.decryptionExtensions?.stop()
        await this.syncedStreamsExtensions?.stop()
        await this.stopSync()
    }

    stream(streamId: string | Uint8Array): SyncedStream | undefined {
        return this.streams.get(streamId)
    }

    createSyncedStream(streamId: string | Uint8Array): SyncedStream {
        check(!this.streams.has(streamId), 'stream already exists')
        const stream = new SyncedStream(
            this.userId,
            streamIdAsString(streamId),
            this,
            this.logEmitFromStream,
            this.persistenceStore,
        )
        this.streams.set(streamId, stream)
        return stream
    }

    private initUserJoinedStreams() {
        assert(isDefined(this.userStreamId), 'userStreamId must be set')
        assert(isDefined(this.syncedStreamsExtensions), 'syncedStreamsExtensions must be set')
        const stream = this.stream(this.userStreamId)
        assert(isDefined(stream), 'userStream must be set')
        stream.on('userJoinedStream', (s) => void this.onJoinedStream(s))
        stream.on('userInvitedToStream', (s) => void this.onInvitedToStream(s))
        stream.on('userLeftStream', (s) => void this.onLeftStream(s))
        this.on('streamInitialized', (s) => void this.onStreamInitialized(s))

        const streamIds = Object.entries(stream.view.userContent.streamMemberships).reduce(
            (acc, [streamId, payload]) => {
                if (
                    payload.op === MembershipOp.SO_JOIN ||
                    (payload.op === MembershipOp.SO_INVITE &&
                        (isDMChannelStreamId(streamId) || isGDMChannelStreamId(streamId)))
                ) {
                    acc.push(streamId)
                }
                return acc
            },
            [] as string[],
        )

        this.syncedStreamsExtensions.setStreamIds(streamIds)
    }

    async initializeUser(opts?: {
        spaceId?: Uint8Array | string
        encryptionDeviceInit?: EncryptionDeviceInitOpts
    }): Promise<{
        initCryptoTime: number
        initUserStreamTime: number
        initUserInboxStreamTime: number
        initUserMetadataStreamTime: number
        initUserSettingsStreamTime: number
    }> {
        const initUserMetadata = opts?.spaceId
            ? {
                  spaceId: streamIdAsBytes(opts?.spaceId),
              }
            : undefined

        const initializeUserStartTime = performance.now()
        this.logCall('initializeUser', this.userId)
        assert(this.userStreamId === undefined, 'already initialized')
        const initCrypto = await getTime(() => this.initCrypto(opts?.encryptionDeviceInit))

        check(isDefined(this.decryptionExtensions), 'decryptionExtensions must be defined')
        check(isDefined(this.syncedStreamsExtensions), 'syncedStreamsExtensions must be defined')

        const [
            initUserStream,
            initUserInboxStream,
            initUserMetadataStream,
            initUserSettingsStream,
        ] = await Promise.all([
            getTime(() => this.initUserStream(initUserMetadata)),
            getTime(() => this.initUserInboxStream(initUserMetadata)),
            getTime(() => this.initUserMetadataStream(initUserMetadata)),
            getTime(() => this.initUserSettingsStream(initUserMetadata)),
        ])
        this.initUserJoinedStreams()

        this.syncedStreamsExtensions.start()
        const initializeUserEndTime = performance.now()
        const executionTime = initializeUserEndTime - initializeUserStartTime
        this.logCall('initializeUser::executionTime', executionTime)

        // all of these init calls follow a similar pattern and call highly similar functions
        // so just tracking more granular times for a single one of these as a start, so there's not too much data to digest
        const initUserMetadataTimes = initUserMetadataStream.result

        return {
            initCryptoTime: initCrypto.time,
            initUserStreamTime: initUserStream.time,
            initUserInboxStreamTime: initUserInboxStream.time,
            initUserMetadataStreamTime: initUserMetadataStream.time,
            initUserSettingsStreamTime: initUserSettingsStream.time,
            ...initUserMetadataTimes,
        }
    }

    public onNetworkStatusChanged(isOnline: boolean) {
        this.streams.onNetworkStatusChanged(isOnline)
    }

    private async initUserStream(metadata: { spaceId: Uint8Array } | undefined) {
        this.userStreamId = makeUserStreamId(this.userId)
        const userStream = this.createSyncedStream(this.userStreamId)
        if (!(await userStream.initializeFromPersistence())) {
            const response =
                (await this.getUserStream(this.userStreamId)) ??
                (await this.createUserStream(this.userStreamId, metadata))
            await userStream.initializeFromResponse(response)
        }
    }

    private async initUserInboxStream(metadata?: { spaceId: Uint8Array }) {
        this.userInboxStreamId = makeUserInboxStreamId(this.userId)
        const userInboxStream = this.createSyncedStream(this.userInboxStreamId)
        if (!(await userInboxStream.initializeFromPersistence())) {
            const response =
                (await this.getUserStream(this.userInboxStreamId)) ??
                (await this.createUserInboxStream(this.userInboxStreamId, metadata))
            await userInboxStream.initializeFromResponse(response)
        }
    }

    private async initUserMetadataStream(metadata?: { spaceId: Uint8Array }) {
        this.userMetadataStreamId = makeUserMetadataStreamId(this.userId)
        const userMetadataStream = this.createSyncedStream(this.userMetadataStreamId)

        let initUserMetadataStreamInitFromPersistenceTime = 0
        let initUserMetadataStreamGetUserStreamTime = 0
        let initUserMetadataStreamCreateUserMetadataStreamTime = 0
        let initUserMetadataStreamInitFromResponseTime = 0

        const initFromPersistence = await getTime(() =>
            userMetadataStream.initializeFromPersistence(),
        )
        initUserMetadataStreamInitFromPersistenceTime = initFromPersistence.time
        if (!initFromPersistence.result) {
            const getUserStreamResponse = await getTime(() => {
                check(!!this.userMetadataStreamId, 'userMetadataStreamId must be set')
                return this.getUserStream(this.userMetadataStreamId)
            })
            initUserMetadataStreamGetUserStreamTime = getUserStreamResponse.time
            let response: ParsedStreamResponse
            if (getUserStreamResponse.result) {
                response = getUserStreamResponse.result
            } else {
                const createUserMetadataStreamResponse = await getTime(() => {
                    check(!!this.userMetadataStreamId, 'userMetadataStreamId must be set')
                    return this.createUserMetadataStream(this.userMetadataStreamId, metadata)
                })
                initUserMetadataStreamCreateUserMetadataStreamTime =
                    createUserMetadataStreamResponse.time
                response = createUserMetadataStreamResponse.result
            }
            const initializeFromResponse = await getTime(() =>
                userMetadataStream.initializeFromResponse(response),
            )
            initUserMetadataStreamInitFromResponseTime = initializeFromResponse.time
        }

        const times = {
            ...(initUserMetadataStreamInitFromPersistenceTime
                ? { initUserMetadataStreamInitFromPersistenceTime }
                : {}),
            ...(initUserMetadataStreamGetUserStreamTime
                ? { initUserMetadataStreamGetUserStreamTime }
                : {}),
            ...(initUserMetadataStreamCreateUserMetadataStreamTime
                ? {
                      initUserMetadataStreamCreateUserMetadataStreamTime,
                  }
                : {}),
            ...(initUserMetadataStreamInitFromResponseTime
                ? { initUserMetadataStreamInitFromResponseTime }
                : {}),
        }

        return times
    }

    private async initUserSettingsStream(metadata?: { spaceId: Uint8Array }) {
        this.userSettingsStreamId = makeUserSettingsStreamId(this.userId)
        const userSettingsStream = this.createSyncedStream(this.userSettingsStreamId)
        if (!(await userSettingsStream.initializeFromPersistence())) {
            const response =
                (await this.getUserStream(this.userSettingsStreamId)) ??
                (await this.createUserSettingsStream(this.userSettingsStreamId, metadata))
            await userSettingsStream.initializeFromResponse(response)
        }
    }

    private async getUserStream(
        streamId: string | Uint8Array,
    ): Promise<ParsedStreamResponse | undefined> {
        const response = await this.rpcClient.getStream({
            streamId: streamIdAsBytes(streamId),
            optional: true,
        })
        if (response.stream) {
            return unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
        } else {
            return undefined
        }
    }

    private async createUserStream(
        userStreamId: string | Uint8Array,
        metadata: { spaceId: Uint8Array } | undefined,
    ): Promise<ParsedStreamResponse> {
        const userEvents = [
            await makeEvent(
                this.signerContext,
                make_UserPayload_Inception({
                    streamId: streamIdAsBytes(userStreamId),
                }),
            ),
        ]
        const response = await this.rpcClient.createStream({
            events: userEvents,
            streamId: streamIdAsBytes(userStreamId),
            metadata: metadata,
        })
        return unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
    }

    private async createUserMetadataStream(
        userMetadataStreamId: string | Uint8Array,
        metadata: { spaceId: Uint8Array } | undefined,
    ): Promise<ParsedStreamResponse> {
        const userDeviceKeyEvents = [
            await makeEvent(
                this.signerContext,
                make_UserMetadataPayload_Inception({
                    streamId: streamIdAsBytes(userMetadataStreamId),
                }),
            ),
        ]

        const response = await this.rpcClient.createStream({
            events: userDeviceKeyEvents,
            streamId: streamIdAsBytes(userMetadataStreamId),
            metadata: metadata,
        })
        return unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
    }

    private async createUserInboxStream(
        userInboxStreamId: string | Uint8Array,
        metadata: { spaceId: Uint8Array } | undefined,
    ): Promise<ParsedStreamResponse> {
        const userInboxEvents = [
            await makeEvent(
                this.signerContext,
                make_UserInboxPayload_Inception({
                    streamId: streamIdAsBytes(userInboxStreamId),
                }),
            ),
        ]

        const response = await this.rpcClient.createStream({
            events: userInboxEvents,
            streamId: streamIdAsBytes(userInboxStreamId),
            metadata: metadata,
        })
        return unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
    }

    private async createUserSettingsStream(
        inUserSettingsStreamId: string | Uint8Array,
        metadata: { spaceId: Uint8Array } | undefined,
    ): Promise<ParsedStreamResponse> {
        const userSettingsStreamId = streamIdAsBytes(inUserSettingsStreamId)
        const userSettingsEvents = [
            await makeEvent(
                this.signerContext,
                make_UserSettingsPayload_Inception({
                    streamId: userSettingsStreamId,
                }),
            ),
        ]

        const response = await this.rpcClient.createStream({
            events: userSettingsEvents,
            streamId: userSettingsStreamId,
            metadata: metadata,
        })
        return unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
    }

    private async createStreamAndSync(
        request: PlainMessage<CreateStreamRequest>,
    ): Promise<{ streamId: string }> {
        const streamId = streamIdAsString(request.streamId)
        try {
            this.creatingStreamIds.add(streamId)
            let response: CreateStreamResponse | GetStreamResponse =
                await this.rpcClient.createStream(request)
            const stream = this.createSyncedStream(streamId)
            if (!response.stream) {
                // if a stream alread exists it will return a nil stream in the response, but no error
                // fetch the stream to get the client in the rigth state
                response = await this.rpcClient.getStream({ streamId: request.streamId })
            }
            const unpacked = await unpackStream(response.stream, this.opts?.unpackEnvelopeOpts)
            await stream.initializeFromResponse(unpacked)
            if (stream.view.syncCookie) {
                this.streams.addStreamToSync(streamId, stream.view.syncCookie)
            }
        } catch (err) {
            this.logError('Failed to create stream', streamId)
            this.streams.delete(streamId)
            this.creatingStreamIds.delete(streamId)
            throw err
        }
        return { streamId: streamId }
    }

    // createSpace
    // param spaceAddress: address of the space contract, or address made with makeSpaceStreamId
    async createSpace(spaceAddressOrId: string): Promise<{ streamId: string }> {
        const oSpaceId =
            spaceAddressOrId.length === STREAM_ID_STRING_LENGTH
                ? spaceAddressOrId
                : makeSpaceStreamId(spaceAddressOrId)
        const spaceId = streamIdAsBytes(oSpaceId)
        this.logCall('createSpace', spaceId)
        assert(this.userStreamId !== undefined, 'streamId must be set')
        assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')

        // create utf8 encoder
        const inceptionEvent = await makeEvent(
            this.signerContext,
            make_SpacePayload_Inception({
                streamId: spaceId,
            }),
        )
        const joinEvent = await makeEvent(
            this.signerContext,
            make_MemberPayload_Membership2({
                userId: this.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: this.userId,
            }),
        )
        return this.createStreamAndSync({
            events: [inceptionEvent, joinEvent],
            streamId: spaceId,
            metadata: {},
        })
    }

    async createChannel(
        spaceId: string | Uint8Array,
        channelName: string,
        channelTopic: string,
        inChannelId: string | Uint8Array,
        streamSettings?: PlainMessage<StreamSettings>,
        channelSettings?: PlainMessage<SpacePayload_ChannelSettings>,
    ): Promise<{ streamId: string }> {
        const oChannelId = inChannelId
        const channelId = streamIdAsBytes(oChannelId)
        this.logCall('createChannel', channelId, spaceId)
        assert(this.userStreamId !== undefined, 'userStreamId must be set')
        assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')
        assert(isChannelStreamId(channelId), 'channelId must be a valid streamId')

        const inceptionEvent = await makeEvent(
            this.signerContext,
            make_ChannelPayload_Inception({
                streamId: channelId,
                spaceId: streamIdAsBytes(spaceId),
                settings: streamSettings,
                channelSettings: channelSettings,
            }),
        )
        const joinEvent = await makeEvent(
            this.signerContext,
            make_MemberPayload_Membership2({
                userId: this.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: this.userId,
            }),
        )
        return this.createStreamAndSync({
            events: [inceptionEvent, joinEvent],
            streamId: channelId,
            metadata: {},
        })
    }

    async createDMChannel(
        userId: string,
        streamSettings?: PlainMessage<StreamSettings>,
    ): Promise<{ streamId: string }> {
        const channelIdStr = makeDMStreamId(this.userId, userId)
        const channelId = streamIdAsBytes(channelIdStr)

        const inceptionEvent = await makeEvent(
            this.signerContext,
            make_DMChannelPayload_Inception({
                streamId: channelId,
                firstPartyAddress: this.signerContext.creatorAddress,
                secondPartyAddress: addressFromUserId(userId),
                settings: streamSettings,
            }),
        )

        const joinEvent = await makeEvent(
            this.signerContext,
            make_MemberPayload_Membership2({
                userId: this.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: this.userId,
            }),
        )

        const inviteEvent = await makeEvent(
            this.signerContext,
            make_MemberPayload_Membership2({
                userId: userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: this.userId,
            }),
        )
        return this.createStreamAndSync({
            events: [inceptionEvent, joinEvent, inviteEvent],
            streamId: channelId,
            metadata: {},
        })
    }

    async createGDMChannel(
        userIds: string[],
        channelProperties?: EncryptedData,
        streamSettings?: PlainMessage<StreamSettings>,
    ): Promise<{ streamId: string }> {
        const channelIdStr = makeUniqueGDMChannelStreamId()
        const channelId = streamIdAsBytes(channelIdStr)

        const events: Envelope[] = []
        const inceptionEvent = await makeEvent(
            this.signerContext,
            make_GDMChannelPayload_Inception({
                streamId: channelId,
                channelProperties: channelProperties,
                settings: streamSettings,
            }),
        )
        events.push(inceptionEvent)
        const joinEvent = await makeEvent(
            this.signerContext,
            make_MemberPayload_Membership2({
                userId: this.userId,
                op: MembershipOp.SO_JOIN,
                initiatorId: this.userId,
            }),
        )
        events.push(joinEvent)

        for (const userId of userIds) {
            const inviteEvent = await makeEvent(
                this.signerContext,
                make_MemberPayload_Membership2({
                    userId: userId,
                    op: MembershipOp.SO_JOIN,
                    initiatorId: this.userId,
                }),
            )
            events.push(inviteEvent)
        }

        return this.createStreamAndSync({
            events: events,
            streamId: channelId,
            metadata: {},
        })
    }

    async createMediaStream(
        channelId: string | Uint8Array | undefined,
        spaceId: string | Uint8Array | undefined,
        userId: string | undefined,
        chunkCount: number,
        firstChunk?: Uint8Array | undefined,
        firstChunkIv?: Uint8Array | undefined,
        streamSettings?: PlainMessage<StreamSettings> | undefined,
        perChunkEncryption?: boolean | undefined,
    ): Promise<{ creationCookie: CreationCookie }> {
        assert(this.userStreamId !== undefined, 'userStreamId must be set')
        if (!channelId && !spaceId && !userId) {
            throw Error('channelId, spaceId or userId must be set')
        }
        if (spaceId) {
            assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')
        }
        if (channelId) {
            assert(
                isChannelStreamId(channelId) ||
                    isDMChannelStreamId(channelId) ||
                    isGDMChannelStreamId(channelId),
                'channelId must be a valid streamId',
            )
        }
        if (userId) {
            assert(isUserId(userId), 'userId must be a valid userId')
        }

        const streamId = makeUniqueMediaStreamId()
        const events: Envelope[] = []
        this.logCall('createMedia', channelId ?? spaceId, userId, streamId)

        // Prepare inception event
        events.push(
            await makeEvent(
                this.signerContext,
                make_MediaPayload_Inception({
                    streamId: streamIdAsBytes(streamId),
                    channelId: channelId ? streamIdAsBytes(channelId) : undefined,
                    spaceId: spaceId ? streamIdAsBytes(spaceId) : undefined,
                    userId: userId ? addressFromUserId(userId) : undefined,
                    chunkCount,
                    settings: streamSettings,
                    perChunkEncryption: perChunkEncryption,
                }),
            ),
        )

        // Prepare first chunk event
        if (firstChunk && firstChunk.length > 0) {
            events.push(
                await makeEvent(
                    this.signerContext,
                    make_MediaPayload_Chunk({
                        data: firstChunk,
                        chunkIndex: 0,
                        iv: firstChunkIv,
                    }),
                ),
            )
        }

        const response = await this.rpcClient.createMediaStream({
            events: events,
            streamId: streamIdAsBytes(streamId),
        })

        check(
            response?.nextCreationCookie !== undefined,
            'nextCreationCookie was expected but was not returned in response',
        )

        return { creationCookie: response.nextCreationCookie }
    }

    async updateChannel(
        spaceId: string | Uint8Array,
        channelId: string | Uint8Array,
        unused1: string,
        unused2: string,
    ) {
        this.logCall('updateChannel', channelId, spaceId, unused1, unused2)
        assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')
        assert(isChannelStreamId(channelId), 'channelId must be a valid streamId')

        return this.makeEventAndAddToStream(
            spaceId, // we send events to the stream of the space where updated channel belongs to
            make_SpacePayload_ChannelUpdate({
                op: ChannelOp.CO_UPDATED,
                channelId: streamIdAsBytes(channelId),
            }),
            { method: 'updateChannel' },
        )
    }

    async updateChannelAutojoin(
        spaceId: string | Uint8Array,
        channelId: string | Uint8Array,
        autojoin: boolean,
    ) {
        this.logCall('updateChannelAutojoin', channelId, spaceId, autojoin)
        assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')
        assert(isChannelStreamId(channelId), 'channelId must be a valid streamId')

        return this.makeEventAndAddToStream(
            spaceId, // we send events to the stream of the space where updated channel belongs to
            make_SpacePayload_UpdateChannelAutojoin({
                channelId: streamIdAsBytes(channelId),
                autojoin: autojoin,
            }),
            { method: 'updateChannelAutojoin' },
        )
    }

    async updateChannelHideUserJoinLeaveEvents(
        spaceId: string | Uint8Array,
        channelId: string | Uint8Array,
        hideUserJoinLeaveEvents: boolean,
    ) {
        this.logCall(
            'updateChannelHideUserJoinLeaveEvents',
            channelId,
            spaceId,
            hideUserJoinLeaveEvents,
        )
        assert(isSpaceStreamId(spaceId), 'spaceId must be a valid streamId')
        assert(isChannelStreamId(channelId), 'channelId must be a valid streamId')

        return this.makeEventAndAddToStream(
            spaceId, // we send events to the stream of the space where updated channel belongs to
            make_SpacePayload_UpdateChannelHideUserJoinLeaveEvents({
                channelId: streamIdAsBytes(channelId),
                hideUserJoinLeaveEvents,
            }),
            { method: 'updateChannelHideUserJoinLeaveEvents' },
        )
    }

    async updateGDMChannelProperties(streamId: string, channelName: string, channelTopic: string) {
        this.logCall('updateGDMChannelProperties', streamId, channelName, channelTopic)
        assert(isGDMChannelStreamId(streamId), 'streamId must be a valid GDM stream id')
        check(isDefined(this.cryptoBackend))

        const channelProps = create(ChannelPropertiesSchema, {
            name: channelName,
            topic: channelTopic,
        } satisfies PlainMessage<ChannelProperties>)
        const encryptedData = await this.cryptoBackend.encryptGroupEvent(
            streamId,
            toBinary(ChannelPropertiesSchema, channelProps),
            this.defaultGroupEncryptionAlgorithm,
        )

        const event = make_GDMChannelPayload_ChannelProperties(encryptedData)
        return this.makeEventAndAddToStream(streamId, event, {
            method: 'updateGDMChannelProperties',
        })
    }

    async setStreamEncryptionAlgorithm(streamId: string, encryptionAlgorithm?: string) {
        assert(
            isChannelStreamId(streamId) ||
                isSpaceStreamId(streamId) ||
                isDMChannelStreamId(streamId) ||
                isGDMChannelStreamId(streamId),
            'channelId must be a valid streamId',
        )
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found')
        check(
            stream.view.membershipContent.encryptionAlgorithm != encryptionAlgorithm,
            `encryptionAlgorithm is already set to ${encryptionAlgorithm}`,
        )
        return this.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_EncryptionAlgorithm(encryptionAlgorithm),
            {
                method: 'setStreamEncryptionAlgorithm',
            },
        )
    }

    async sendFullyReadMarkers(
        channelId: string | Uint8Array,
        fullyReadMarkers: Record<string, FullyReadMarker>,
    ) {
        this.logCall('sendFullyReadMarker', fullyReadMarkers)

        if (!isDefined(this.userSettingsStreamId)) {
            throw Error('userSettingsStreamId is not defined')
        }

        const fullyReadMarkersContent: FullyReadMarkers = create(FullyReadMarkersSchema, {
            markers: fullyReadMarkers,
        } satisfies PlainMessage<FullyReadMarkers>)

        return this.makeEventAndAddToStream(
            this.userSettingsStreamId,
            make_UserSettingsPayload_FullyReadMarkers({
                streamId: streamIdAsBytes(channelId),
                content: { data: toJsonString(FullyReadMarkersSchema, fullyReadMarkersContent) },
            }),
            { method: 'sendFullyReadMarker' },
        )
    }

    async updateUserBlock(userId: string, isBlocked: boolean) {
        this.logCall('blockUser', userId)

        if (!isDefined(this.userSettingsStreamId)) {
            throw Error('userSettingsStreamId is not defined')
        }
        const dmStreamId = makeDMStreamId(this.userId, userId)
        const lastBlock = this.stream(
            this.userSettingsStreamId,
        )?.view.userSettingsContent.getLastBlock(userId)

        if (lastBlock?.isBlocked === isBlocked) {
            throw Error(
                `updateUserBlock isBlocked<${isBlocked}> must be different from existing value`,
            )
        }

        let eventNum = this.stream(dmStreamId)?.view.lastEventNum ?? 0n
        if (lastBlock && lastBlock.eventNum >= eventNum) {
            eventNum = lastBlock.eventNum + 1n
        }

        return this.makeEventAndAddToStream(
            this.userSettingsStreamId,
            make_UserSettingsPayload_UserBlock({
                userId: addressFromUserId(userId),
                isBlocked: isBlocked,
                eventNum: eventNum,
            }),
            { method: 'updateUserBlock' },
        )
    }

    async setSpaceImage(spaceStreamId: string, chunkedMediaInfo: PlainMessage<ChunkedMedia>) {
        this.logCall(
            'setSpaceImage',
            spaceStreamId,
            chunkedMediaInfo.streamId,
            chunkedMediaInfo.info,
        )

        // create the chunked media to be added
        const spaceAddress = contractAddressFromSpaceId(spaceStreamId)
        const context = spaceAddress.toLowerCase()

        // encrypt the chunked media
        // use the lowercased spaceId as the key phrase
        const { key, iv } = await deriveKeyAndIV(context)
        const { ciphertext } = await encryptAESGCM(
            toBinary(ChunkedMediaSchema, create(ChunkedMediaSchema, chunkedMediaInfo)),
            key,
            iv,
        )
        const encryptedData = create(EncryptedDataSchema, {
            ciphertext: uint8ArrayToBase64(ciphertext),
            algorithm: AES_GCM_DERIVED_ALGORITHM,
        }) // aellis this should probably include `satisfies PlainMessage<EncryptedData>`

        // add the event to the stream
        const event = make_SpacePayload_SpaceImage(encryptedData)
        return this.makeEventAndAddToStream(spaceStreamId, event, { method: 'setSpaceImage' })
    }

    async setUserProfileImage(chunkedMediaInfo: PlainMessage<ChunkedMedia>) {
        this.logCall('setUserProfileImage', chunkedMediaInfo.streamId, chunkedMediaInfo.info)

        // create the chunked media to be added
        const context = this.userId.toLowerCase()
        const userStreamId = makeUserMetadataStreamId(this.userId)

        // encrypt the chunked media
        // use the lowercased userId as the key phrase
        const { key, iv } = await deriveKeyAndIV(context)
        const { ciphertext } = await encryptAESGCM(
            toBinary(ChunkedMediaSchema, create(ChunkedMediaSchema, chunkedMediaInfo)),
            key,
            iv,
        )
        const encryptedData = create(EncryptedDataSchema, {
            ciphertext: uint8ArrayToBase64(ciphertext),
            algorithm: AES_GCM_DERIVED_ALGORITHM,
        }) // aellis this should probably include `satisfies PlainMessage<EncryptedData>`

        // add the event to the stream
        const event = make_UserMetadataPayload_ProfileImage(encryptedData)
        return this.makeEventAndAddToStream(userStreamId, event, { method: 'setUserProfileImage' })
    }

    async getUserProfileImage(userId: string | Uint8Array) {
        const streamId = makeUserMetadataStreamId(userId)
        return this.stream(streamId)?.view.userMetadataContent.getProfileImage()
    }

    async setUserBio(bio: PlainMessage<UserBio>) {
        this.logCall('setUserBio', bio)

        // create the chunked media to be added
        const context = this.userId.toLowerCase()
        const userStreamId = makeUserMetadataStreamId(this.userId)

        // encrypt the chunked media
        // use the lowercased userId as the key phrase
        const { key, iv } = await deriveKeyAndIV(context)
        bio.updatedAtEpochMs = BigInt(Date.now())
        const bioBinary = toBinary(UserBioSchema, create(UserBioSchema, bio))
        const { ciphertext } = await encryptAESGCM(bioBinary, key, iv)
        const encryptedData = create(EncryptedDataSchema, {
            ciphertext: uint8ArrayToBase64(ciphertext),
            algorithm: AES_GCM_DERIVED_ALGORITHM,
        }) // aellis this should probably include `satisfies PlainMessage<EncryptedData>`

        // add the event to the stream
        const event = make_UserMetadataPayload_Bio(encryptedData)
        return this.makeEventAndAddToStream(userStreamId, event, { method: 'setUserBio' })
    }

    async getUserBio(userId: string | Uint8Array) {
        const streamId = makeUserMetadataStreamId(userId)
        return this.stream(streamId)?.view.userMetadataContent.getBio()
    }

    async setDisplayName(streamId: string, displayName: string) {
        check(isDefined(this.cryptoBackend))
        const encryptedData = await this.cryptoBackend.encryptGroupEvent(
            streamId,
            new TextEncoder().encode(displayName),
            this.defaultGroupEncryptionAlgorithm,
        )
        await this.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_DisplayName(encryptedData),
            { method: 'displayName' },
        )
    }

    async setUsername(streamId: string, username: string) {
        check(isDefined(this.cryptoBackend))
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found')
        stream.view.getMemberMetadata().usernames.setLocalUsername(this.userId, username)
        const encryptedData = await this.cryptoBackend.encryptGroupEvent(
            streamId,
            new TextEncoder().encode(username),
            this.defaultGroupEncryptionAlgorithm,
        )
        encryptedData.checksum = usernameChecksum(username, streamId)
        try {
            await this.makeEventAndAddToStream(
                streamId,
                make_MemberPayload_Username(encryptedData),
                {
                    method: 'username',
                },
            )
        } catch (err) {
            stream.view.getMemberMetadata().usernames.resetLocalUsername(this.userId)
            throw err
        }
    }

    async setEnsAddress(streamId: string, walletAddress: string | Uint8Array) {
        check(isDefined(this.cryptoBackend))
        const bytes =
            typeof walletAddress === 'string' ? addressFromUserId(walletAddress) : walletAddress

        await this.makeEventAndAddToStream(streamId, make_MemberPayload_EnsAddress(bytes), {
            method: 'ensAddress',
        })
    }

    async setNft(streamId: string, tokenId: string, chainId: number, contractAddress: string) {
        const payload =
            tokenId.length > 0
                ? create(MemberPayload_NftSchema, {
                      chainId: chainId,
                      contractAddress: bin_fromHexString(contractAddress),
                      tokenId: bin_fromString(tokenId),
                  } satisfies PlainMessage<MemberPayload_Nft>)
                : create(MemberPayload_NftSchema)
        await this.makeEventAndAddToStream(streamId, make_MemberPayload_Nft(payload), {
            method: 'nft',
        })
    }

    async pin(streamId: string, eventId: string) {
        const stream = this.streams.get(streamId)
        check(isDefined(stream), 'stream not found')
        const event = stream.view.events.get(eventId)
        check(isDefined(event), 'event not found')
        const remoteEvent = event.remoteEvent
        check(isDefined(remoteEvent), 'remoteEvent not found')
        const result = await this.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_Pin(remoteEvent.hash, remoteEvent.event),
            {
                method: 'pin',
            },
        )
        return result
    }

    async unpin(streamId: string, eventId: string) {
        const stream = this.streams.get(streamId)
        check(isDefined(stream), 'stream not found')
        const pin = stream.view.membershipContent.pins.find((x) => x.event.hashStr === eventId)
        check(isDefined(pin), 'pin not found')
        check(isDefined(pin.event.remoteEvent), 'remoteEvent not found')
        const result = await this.makeEventAndAddToStream(
            streamId,
            make_MemberPayload_Unpin(pin.event.remoteEvent.hash),
            {
                method: 'unpin',
            },
        )
        return result
    }

    isUsernameAvailable(streamId: string, username: string): boolean {
        const stream = this.streams.get(streamId)
        check(isDefined(stream), 'stream not found')
        return (
            stream.view.getMemberMetadata().usernames.cleartextUsernameAvailable(username) ?? false
        )
    }

    async waitForStream(
        inStreamId: string | Uint8Array,
        opts?: { timeoutMs?: number; logId?: string },
    ): Promise<Stream> {
        this.logCall('waitForStream', inStreamId)
        const timeoutMs = opts?.timeoutMs ?? getMaxTimeoutMs(this.rpcClient.opts)
        const streamId = streamIdAsString(inStreamId)
        let stream = this.stream(streamId)
        if (stream !== undefined && stream.view.isInitialized) {
            this.logCall('waitForStream: stream already initialized', streamId)
            return stream
        }
        const logId = opts?.logId ? opts.logId + ' ' : ''
        const timeoutError = new Error(
            `waitForStream: timeout waiting for ${logId}${streamId} creating streams: ${Array.from(
                this.creatingStreamIds,
            ).join(',')} rpcUrl: ${this.rpcClient.url}`,
        )
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.off('streamInitialized', handler)
                reject(timeoutError)
            }, timeoutMs)
            const handler = (newStreamId: string) => {
                if (newStreamId === streamId) {
                    this.logCall('waitForStream: got streamInitialized', newStreamId)
                    this.off('streamInitialized', handler)
                    clearTimeout(timeout)
                    resolve()
                } else {
                    this.logCall(
                        'waitForStream: still waiting for ',
                        streamId,
                        ' got ',
                        newStreamId,
                    )
                }
            }
            this.on('streamInitialized', handler)
        })

        stream = this.stream(streamId)
        if (!stream) {
            throw new Error(`Stream ${streamIdAsString(streamId)} not found after waiting`)
        }
        return stream
    }

    async getStream(streamId: string): Promise<StreamStateView> {
        const existingRequest = this.getStreamRequests.get(streamId)
        if (existingRequest) {
            this.logCall(`had existing get request for ${streamId}, returning promise`)
            return await existingRequest
        }

        const request = this._getStream(streamId)
        this.getStreamRequests.set(streamId, request)
        let streamView: StreamStateView
        try {
            streamView = await request
        } finally {
            this.getStreamRequests.delete(streamId)
        }
        return streamView
    }

    private async _getStream(streamId: string | Uint8Array): Promise<StreamStateView> {
        try {
            this.logCall('getStream', streamId)
            const response = await this.rpcClient.getStream({
                streamId: streamIdAsBytes(streamId),
            })
            const unpackedResponse = await unpackStream(
                response.stream,
                this.opts?.unpackEnvelopeOpts,
            )
            return this.streamViewFromUnpackedResponse(streamId, unpackedResponse)
        } catch (err) {
            this.logCall('getStream', streamId, 'ERROR', err)
            throw err
        }
    }

    private streamViewFromUnpackedResponse(
        streamId: string | Uint8Array,
        unpackedResponse: ParsedStreamResponse,
    ): StreamStateView {
        const streamView = new StreamStateView(this.userId, streamIdAsString(streamId))
        streamView.initialize(
            unpackedResponse.streamAndCookie.nextSyncCookie,
            unpackedResponse.streamAndCookie.events,
            unpackedResponse.snapshot,
            unpackedResponse.streamAndCookie.miniblocks,
            [],
            unpackedResponse.prevSnapshotMiniblockNum,
            undefined,
            [],
            undefined,
        )
        return streamView
    }

    async getStreamEx(streamId: string): Promise<StreamStateView> {
        const existingRequest = this.getStreamExRequests.get(streamId)
        if (existingRequest) {
            this.logCall(`had existing get request for ${streamId}, returning promise`)
            return await existingRequest
        }
        const request = this._getStreamEx(streamId)
        this.getStreamExRequests.set(streamId, request)
        let streamView: StreamStateView
        try {
            streamView = await request
        } finally {
            this.getStreamExRequests.delete(streamId)
        }
        return streamView
    }

    private async _getStreamEx(streamId: string | Uint8Array): Promise<StreamStateView> {
        try {
            this.logCall('getStreamEx', streamId)
            const response = this.rpcClient.getStreamEx({
                streamId: streamIdAsBytes(streamId),
            })
            const miniblocks: Miniblock[] = []
            let seenEndOfStream = false
            for await (const chunk of response) {
                switch (chunk.data.case) {
                    case 'miniblock':
                        if (seenEndOfStream) {
                            throw new Error(
                                `GetStreamEx: received miniblock after minipool contents for stream ${streamIdAsString(
                                    streamId,
                                )}.`,
                            )
                        }
                        miniblocks.push(chunk.data.value)
                        break
                    case 'minipool':
                        // TODO: add minipool contents to the unpacked response
                        break
                    case undefined:
                        seenEndOfStream = true
                        break
                }
            }
            if (!seenEndOfStream) {
                throw new Error(
                    `Failed receive all getStreamEx streaming responses for stream ${streamIdAsString(
                        streamId,
                    )}.`,
                )
            }
            const unpackedResponse = await unpackStreamEx(miniblocks, this.opts?.unpackEnvelopeOpts)
            return this.streamViewFromUnpackedResponse(streamId, unpackedResponse)
        } catch (err) {
            this.logCall('getStreamEx', streamId, 'ERROR', err)
            throw err
        }
    }

    async initStream(
        streamId: string | Uint8Array,
        allowGetStream: boolean = true,
        persistedData?: LoadedStream,
    ): Promise<Stream> {
        const streamIdStr = streamIdAsString(streamId)
        const existingRequest = this.initStreamRequests.get(streamIdStr)
        if (existingRequest) {
            this.logCall('initStream: had existing request for', streamIdStr, 'returning promise')
            return existingRequest
        }
        const request = this._initStream(streamIdStr, allowGetStream, persistedData)
        this.initStreamRequests.set(streamIdStr, request)
        let stream: Stream
        try {
            stream = await request
        } finally {
            this.initStreamRequests.delete(streamIdStr)
        }
        return stream
    }

    private async _initStream(
        streamId: string,
        allowGetStream: boolean = true,
        persistedData?: LoadedStream,
    ): Promise<Stream> {
        try {
            this.logCall('initStream', streamId)
            const stream = this.stream(streamId)
            if (stream) {
                if (stream.view.isInitialized) {
                    this.logCall('initStream', streamId, 'already initialized')
                    return stream
                } else {
                    return this.waitForStream(streamId)
                }
            } else {
                this.logCall('initStream creating stream', streamId)
                const stream = this.createSyncedStream(streamId)

                // Try initializing from persistence
                const success = await stream.initializeFromPersistence(persistedData)
                if (success) {
                    if (stream.view.syncCookie) {
                        this.streams.addStreamToSync(streamId, stream.view.syncCookie)
                    }
                    return stream
                }

                // if we're only allowing initializing from persistence, we've failed.
                if (!allowGetStream) {
                    this.logCall('initStream deleting stream', streamId)
                    // We need to remove the stream from syncedStreams, since we added it above
                    this.streams.delete(streamId)
                    throw new Error(
                        `Failed to initialize stream from persistence ${streamIdAsString(
                            streamId,
                        )}`,
                    )
                }

                try {
                    const response = await this.rpcClient.getStream({
                        streamId: streamIdAsBytes(streamId),
                    })
                    const unpacked = await unpackStream(
                        response.stream,
                        this.opts?.unpackEnvelopeOpts,
                    )
                    this.logCall('initStream calling initializingFromResponse', streamId)
                    await stream.initializeFromResponse(unpacked)
                    if (stream.view.syncCookie) {
                        this.streams.addStreamToSync(streamId, stream.view.syncCookie)
                    }
                } catch (err) {
                    this.logError('Failed to initialize stream', streamId, err)
                    this.streams.delete(streamId)
                    throw err
                }
                return stream
            }
        } catch (err) {
            this.logCall('initStream', streamId, 'ERROR', err)
            throw err
        }
    }

    private onJoinedStream = async (streamId: string): Promise<void> => {
        this.logEvent('onJoinedStream', streamId)
        if (!this.creatingStreamIds.has(streamId)) {
            await this.initStream(streamId)
        }
    }

    private onInvitedToStream = async (streamId: string): Promise<void> => {
        this.logEvent('onInvitedToStream', streamId)
        if (isDMChannelStreamId(streamId) || isGDMChannelStreamId(streamId)) {
            await this.initStream(streamId)
        }
    }

    private onLeftStream = async (streamId: string): Promise<void> => {
        this.logEvent('onLeftStream', streamId)
        return await this.streams.removeStreamFromSync(streamId)
    }

    private onStreamInitialized = (streamId: string): void => {
        const scrollbackUntilContentFound = async () => {
            const stream = this.streams.get(streamId)
            if (!stream) {
                return
            }
            while (stream.view.getContent().needsScrollback()) {
                const scrollback = await this.scrollback(streamId)
                if (scrollback.terminus) {
                    break
                }
            }
        }
        void scrollbackUntilContentFound()
    }

    startSync() {
        check(this.syncedStreamsExtensions !== undefined, 'syncedStreamsExtensions must be set')
        this.syncedStreamsExtensions.setStartSyncRequested(true)
    }

    async stopSync() {
        this.syncedStreamsExtensions?.setStartSyncRequested(false)
        await this.streams.stopSync()
    }

    emit<E extends keyof ClientEvents>(event: E, ...args: Parameters<ClientEvents[E]>): boolean {
        this.logEmitFromClient(event, ...args)
        return super.emit(event, ...args)
    }

    async sendMessage(
        streamId: string,
        body: string,
        mentions?: PlainMessage<ChannelMessage_Post_Mention>[],
        attachments: PlainMessage<ChannelMessage_Post_Attachment>[] = [],
    ): Promise<{ eventId: string }> {
        return this.sendChannelMessage_Text(streamId, {
            content: {
                body,
                mentions: mentions ?? [],
                attachments: attachments,
            },
        })
    }

    async sendChannelMessage(
        streamId: string,
        inPayload: PlainMessage<ChannelMessage>,
        opts?: SendChannelMessageOptions,
    ): Promise<{ eventId: string }> {
        const stream = this.stream(streamId)

        check(stream !== undefined, 'stream not found')
        const payload = create(ChannelMessageSchema, inPayload)
        const localId = stream.appendLocalEvent(payload, 'sending')
        opts?.onLocalEventAppended?.(localId)
        if (opts?.beforeSendEventHook) {
            await opts?.beforeSendEventHook
        }
        return this.makeAndSendChannelMessageEvent(streamId, payload, localId, {
            disableTags: opts?.disableTags,
        })
    }

    private async makeAndSendChannelMessageEvent(
        streamId: string,
        payload: ChannelMessage,
        localId?: string,
        opts?: { disableTags?: boolean },
    ) {
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found')

        if (isChannelStreamId(streamId)) {
            // All channel messages sent via client API make their way to this method.
            // The client checks for it's own entitlement to send messages to a channel
            // before sending.
            check(
                isDefined(stream?.view.channelContent.spaceId),
                'synced channel stream not initialized',
            )

            // We check entitlements on the client side for writes to channels. A top-level
            // message post is only permitted if the user has write permissions. If the message
            // is a reaction or redaction, the user may also have react permissions. This is
            // to allow react-only users to react to posts and edit their reactions. We're not
            // concerned with being overly permissive with redactions, as at this time, a user
            // is always allowed to redact their own messages.
            const expectedPermissions: Permission[] =
                payload.payload.case === 'reaction' || payload.payload.case === 'redaction'
                    ? [Permission.React, Permission.Write]
                    : [Permission.Write]
            let isEntitled = false
            for (const permission of expectedPermissions) {
                isEntitled = await this.entitlementsDelegate.isEntitled(
                    stream.view.channelContent.spaceId,
                    streamId,
                    this.userId,
                    permission,
                )
                if (isEntitled) {
                    break
                }
            }
            if (!isEntitled) {
                throw new Error(
                    `user is not entitled to add message to channel (requires [${expectedPermissions.join(
                        ',',
                    )}] permission)`,
                )
            }
        }

        const tags = opts?.disableTags === true ? undefined : makeTags(payload, stream.view)
        const cleartext = toBinary(ChannelMessageSchema, payload)

        let message: EncryptedData
        const encryptionAlgorithm = stream.view.membershipContent.encryptionAlgorithm
        const buffer = toBinary(ChannelMessageSchema, payload)
        switch (encryptionAlgorithm) {
            case GroupEncryptionAlgorithmId.HybridGroupEncryption:
                message = await this.encryptGroupEvent(
                    buffer,
                    streamId,
                    GroupEncryptionAlgorithmId.HybridGroupEncryption,
                )
                break
            case GroupEncryptionAlgorithmId.GroupEncryption:
                message = await this.encryptGroupEvent(
                    buffer,
                    streamId,
                    GroupEncryptionAlgorithmId.GroupEncryption,
                )
                break
            default: {
                message = await this.encryptGroupEvent(
                    buffer,
                    streamId,
                    this.defaultGroupEncryptionAlgorithm,
                )
            }
        }
        if (!message) {
            throw new Error('failed to encrypt message')
        }
        message.refEventId = getRefEventIdFromChannelMessage(payload)

        if (isChannelStreamId(streamId)) {
            return this.makeEventAndAddToStream(streamId, make_ChannelPayload_Message(message), {
                method: 'sendMessage',
                localId,
                cleartext,
                tags,
            })
        } else if (isDMChannelStreamId(streamId)) {
            return this.makeEventAndAddToStream(streamId, make_DMChannelPayload_Message(message), {
                method: 'sendMessageDM',
                localId,
                cleartext,
                tags,
            })
        } else if (isGDMChannelStreamId(streamId)) {
            return this.makeEventAndAddToStream(streamId, make_GDMChannelPayload_Message(message), {
                method: 'sendMessageGDM',
                localId,
                cleartext,
                tags,
            })
        } else {
            throw new Error(`invalid streamId: ${streamId}`)
        }
    }

    async sendChannelMessage_Text(
        streamId: string,
        payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
            content: PlainMessage<ChannelMessage_Post_Content_Text>
        },
        opts?: SendChannelMessageOptions,
    ): Promise<{ eventId: string }> {
        const { content, ...options } = payload
        return this.sendChannelMessage(
            streamId,
            {
                payload: {
                    case: 'post',
                    value: {
                        ...options,
                        content: {
                            case: 'text',
                            value: content,
                        },
                    },
                },
            },
            opts,
        )
    }

    async sendChannelMessage_Image(
        streamId: string,
        payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
            content: PlainMessage<ChannelMessage_Post_Content_Image>
        },
        opts?: SendChannelMessageOptions,
    ): Promise<{ eventId: string }> {
        const { content, ...options } = payload
        return this.sendChannelMessage(
            streamId,
            {
                payload: {
                    case: 'post',
                    value: {
                        ...options,
                        content: {
                            case: 'image',
                            value: content,
                        },
                    },
                },
            },
            opts,
        )
    }

    async sendChannelMessage_GM(
        streamId: string,
        payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
            content: PlainMessage<ChannelMessage_Post_Content_GM>
        },
        opts?: SendChannelMessageOptions,
    ): Promise<{ eventId: string }> {
        const { content, ...options } = payload
        return this.sendChannelMessage(
            streamId,
            {
                payload: {
                    case: 'post',
                    value: {
                        ...options,
                        content: {
                            case: 'gm',
                            value: content,
                        },
                    },
                },
            },
            opts,
        )
    }

    async sendMediaPayload(
        creationCookie: CreationCookie,
        last: boolean,
        data: Uint8Array,
        chunkIndex: number,
        iv?: Uint8Array,
    ): Promise<{ creationCookie: CreationCookie }> {
        const payload = make_MediaPayload_Chunk({
            data: data,
            chunkIndex: chunkIndex,
            iv: iv,
        })
        return this.makeMediaEventWithHashAndAddToMediaStream(creationCookie, last, payload)
    }

    async getMediaPayload(
        streamId: string,
        secretKey: Uint8Array,
        iv: Uint8Array,
    ): Promise<Uint8Array | undefined> {
        const stream = await this.getStream(streamId)
        const mediaInfo = stream.mediaContent.info
        if (!mediaInfo) {
            return undefined
        }
        const data = new Uint8Array(
            mediaInfo.chunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0),
        )
        let offset = 0
        mediaInfo.chunks.forEach((chunk) => {
            data.set(chunk, offset)
            offset += chunk.length
        })

        return decryptAESGCM(data, secretKey, iv)
    }

    async sendChannelMessage_Reaction(
        streamId: string,
        payload: PlainMessage<ChannelMessage_Reaction>,
        opts?: SendChannelMessageOptions,
    ): Promise<{ eventId: string }> {
        return this.sendChannelMessage(
            streamId,
            {
                payload: {
                    case: 'reaction',
                    value: payload,
                },
            },
            opts,
        )
    }

    async sendChannelMessage_Redaction(
        streamId: string,
        payload: PlainMessage<ChannelMessage_Redaction>,
    ): Promise<{ eventId: string }> {
        const stream = this.stream(streamId)
        if (!stream) {
            throw new Error(`stream not found: ${streamId}`)
        }
        if (!stream.view.events.has(payload.refEventId)) {
            throw new Error(`ref event not found: ${payload.refEventId}`)
        }
        return this.sendChannelMessage(streamId, {
            payload: {
                case: 'redaction',
                value: payload,
            },
        })
    }

    async sendChannelMessage_Edit(
        streamId: string,
        refEventId: string,
        newPost: PlainMessage<ChannelMessage_Post>,
    ): Promise<{ eventId: string }> {
        return this.sendChannelMessage(streamId, {
            payload: {
                case: 'edit',
                value: {
                    refEventId: refEventId,
                    post: newPost,
                },
            },
        })
    }

    async sendChannelMessage_Edit_Text(
        streamId: string,
        refEventId: string,
        payload: Omit<PlainMessage<ChannelMessage_Post>, 'content'> & {
            content: PlainMessage<ChannelMessage_Post_Content_Text>
        },
    ): Promise<{ eventId: string }> {
        const { content, ...options } = payload
        return this.sendChannelMessage_Edit(streamId, refEventId, {
            ...options,
            content: {
                case: 'text',
                value: content,
            },
        })
    }

    async redactMessage(streamId: string, eventId: string): Promise<{ eventId: string }> {
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found')

        return this.makeEventAndAddToStream(
            streamId,
            make_ChannelPayload_Redaction(bin_fromHexString(eventId)),
            {
                method: 'redactMessage',
            },
        )
    }

    async retrySendMessage(streamId: string, localId: string): Promise<void> {
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found' + streamId)
        const event = stream.view.events.get(localId)
        check(isDefined(event), 'event not found')
        check(isDefined(event.localEvent), 'event not found')
        check(event.localEvent.status === 'failed', 'event not in failed state')
        await this.makeAndSendChannelMessageEvent(
            streamId,
            event.localEvent.channelMessage,
            event.hashStr,
        )
    }

    async inviteUser(streamId: string | Uint8Array, userId: string): Promise<{ eventId: string }> {
        await this.initStream(streamId)
        check(isDefined(this.userStreamId))
        return this.makeEventAndAddToStream(
            this.userStreamId,
            make_UserPayload_UserMembershipAction({
                op: MembershipOp.SO_INVITE,
                userId: addressFromUserId(userId),
                streamId: streamIdAsBytes(streamId),
            }),
            { method: 'inviteUser' },
        )
    }

    async joinUser(streamId: string | Uint8Array, userId: string): Promise<{ eventId: string }> {
        await this.initStream(streamId)
        check(isDefined(this.userStreamId))
        return this.makeEventAndAddToStream(
            this.userStreamId,
            make_UserPayload_UserMembershipAction({
                op: MembershipOp.SO_JOIN,
                userId: addressFromUserId(userId),
                streamId: streamIdAsBytes(streamId),
            }),
            { method: 'inviteUser' },
        )
    }

    async joinStream(
        streamId: string | Uint8Array,
        opts?: {
            skipWaitForMiniblockConfirmation?: boolean
            skipWaitForUserStreamUpdate?: boolean
        },
    ): Promise<Stream> {
        this.logCall('joinStream', streamId)
        check(isDefined(this.userStreamId))
        const userStream = this.stream(this.userStreamId)
        check(isDefined(userStream), 'userStream not found')
        const streamIdStr = streamIdAsString(streamId)
        const stream = await this.initStream(streamId)
        // check your user stream for membership as that's the final source of truth
        if (userStream.view.userContent.isJoined(streamIdStr)) {
            this.logError('joinStream: user already a member', streamId)
            return stream
        }
        // add event to user stream, this triggers events in the target stream
        await this.makeEventAndAddToStream(
            this.userStreamId,
            make_UserPayload_UserMembership({
                op: MembershipOp.SO_JOIN,
                streamId: streamIdAsBytes(streamId),
                streamParentId: stream.view.getContent().getStreamParentIdAsBytes(),
            }),
            { method: 'joinStream' },
        )

        if (opts?.skipWaitForMiniblockConfirmation !== true) {
            await stream.waitForMembership(MembershipOp.SO_JOIN)
        }

        if (opts?.skipWaitForUserStreamUpdate !== true) {
            if (!userStream.view.userContent.isJoined(streamIdStr)) {
                await userStream.waitFor('userStreamMembershipChanged', () =>
                    userStream.view.userContent.isJoined(streamIdStr),
                )
            }
        }

        return stream
    }

    async leaveStream(streamId: string | Uint8Array): Promise<{ eventId: string }> {
        this.logCall('leaveStream', streamId)
        check(isDefined(this.userStreamId))

        if (isSpaceStreamId(streamId)) {
            const channelIds =
                this.stream(streamId)?.view.spaceContent.spaceChannelsMetadata.keys() ?? []

            const userStream = this.stream(this.userStreamId)
            for (const channelId of channelIds) {
                if (
                    userStream?.view.userContent.streamMemberships[channelId]?.op ===
                    MembershipOp.SO_JOIN
                ) {
                    await this.leaveStream(channelId)
                }
            }
        }

        return this.makeEventAndAddToStream(
            this.userStreamId,
            make_UserPayload_UserMembership({
                op: MembershipOp.SO_LEAVE,
                streamId: streamIdAsBytes(streamId),
            }),
            { method: 'leaveStream' },
        )
    }

    async removeUser(streamId: string | Uint8Array, userId: string): Promise<{ eventId: string }> {
        check(isDefined(this.userStreamId))
        this.logCall('removeUser', streamId, userId)

        if (isSpaceStreamId(streamId)) {
            const channelIds =
                this.stream(streamId)?.view.spaceContent.spaceChannelsMetadata.keys() ?? []
            const userStreamId = makeUserStreamId(userId)
            const userStream = await this.getStream(userStreamId)

            for (const channelId of channelIds) {
                if (
                    userStream.userContent.streamMemberships[channelId]?.op === MembershipOp.SO_JOIN
                ) {
                    try {
                        await this.removeUser(channelId, userId)
                    } catch (error) {
                        this.logError('Failed to remove user from channel', {
                            channelId,
                            userId,
                            error,
                        })
                    }
                }
            }
        }

        return this.makeEventAndAddToStream(
            this.userStreamId,
            make_UserPayload_UserMembershipAction({
                op: MembershipOp.SO_LEAVE,
                userId: addressFromUserId(userId),
                streamId: streamIdAsBytes(streamId),
            }),
            { method: 'removeUser' },
        )
    }

    // upload transactions made on the base chain
    async addTransaction(
        chainId: number,
        receipt: ContractReceipt | SolanaTransactionReceipt,
        content?: PlainMessage<BlockchainTransaction>['content'],
        tags?: PlainMessage<Tags>,
    ): Promise<{ eventId: string }> {
        check(isDefined(this.userStreamId))
        const transaction = {
            receipt: !isSolanaTransactionReceipt(receipt)
                ? create(BlockchainTransactionReceiptSchema, {
                      chainId: BigInt(chainId),
                      transactionHash: bin_fromHexString(receipt.transactionHash),
                      blockNumber: BigInt(receipt.blockNumber),
                      to: bin_fromHexString(receipt.to),
                      from: bin_fromHexString(receipt.from),
                      logs: receipt.logs.map((log) =>
                          create(BlockchainTransactionReceipt_LogSchema, {
                              address: bin_fromHexString(log.address),
                              topics: log.topics.map(bin_fromHexString),
                              data: bin_fromHexString(log.data),
                          }),
                      ),
                  } satisfies PlainMessage<BlockchainTransactionReceipt>)
                : undefined,
            solanaReceipt: isSolanaTransactionReceipt(receipt)
                ? create(SolanaBlockchainTransactionReceiptSchema, {
                      ...receipt,
                  } satisfies PlainMessage<SolanaBlockchainTransactionReceipt>)
                : undefined,
            content: content ?? { case: undefined },
        } satisfies PlainMessage<BlockchainTransaction>
        const event = make_UserPayload_BlockchainTransaction(transaction)
        return this.makeEventAndAddToStream(this.userStreamId, event, {
            method: 'addTransaction',
            tags,
        })
    }

    async addTransaction_Tip(
        chainId: number,
        receipt: ContractReceipt,
        event: TipEventObject,
        toUserId: string,
        opts?: SendBlockchainTransactionOptions,
    ): Promise<{ eventId: string }> {
        const stream = this.stream(ensureNoHexPrefix(event.channelId))
        const tags =
            opts?.disableTags || !stream?.view
                ? undefined
                : makeTipTags(event, toUserId, stream.view)
        return this.addTransaction(
            chainId,
            receipt,
            {
                case: 'tip',
                value: {
                    event: {
                        tokenId: event.tokenId.toBigInt(),
                        currency: bin_fromHexString(event.currency),
                        sender: addressFromUserId(event.sender),
                        receiver: addressFromUserId(event.receiver),
                        amount: event.amount.toBigInt(),
                        messageId: bin_fromHexString(event.messageId),
                        channelId: streamIdAsBytes(event.channelId),
                    },
                    toUserAddress: addressFromUserId(toUserId),
                },
            },
            tags,
        )
    }

    async addTransaction_Transfer(
        chainId: number,
        receipt: ContractReceipt | SolanaTransactionReceipt,
        event: PlainMessage<BlockchainTransaction_TokenTransfer>,
        opts?: SendBlockchainTransactionOptions,
    ): Promise<{ eventId: string }> {
        const stream = this.stream(streamIdAsString(event.channelId))
        const tags =
            opts?.disableTags || !stream?.view ? undefined : makeTransferTags(event, stream.view)
        return this.addTransaction(
            chainId,
            receipt,
            {
                case: 'tokenTransfer',
                value: event,
            },
            tags,
        )
    }

    async addTransaction_SpaceReview(
        chainId: number,
        receipt: ContractReceipt,
        event: SpaceReviewEventObject,
        spaceId: string,
    ): Promise<{ eventId: string }> {
        check(event.action !== SpaceReviewAction.None, 'invalid space review event')
        return this.addTransaction(chainId, receipt, {
            case: 'spaceReview',
            value: {
                action: event.action.valueOf(),
                spaceAddress: bin_fromHexString(SpaceAddressFromSpaceId(spaceId)),
                event: {
                    rating: event.rating,
                    user: addressFromUserId(event.user),
                },
            },
        })
    }

    async getMiniblocks(
        streamId: string | Uint8Array,
        fromInclusive: bigint,
        toExclusive: bigint,
    ): Promise<{ miniblocks: ParsedMiniblock[]; terminus: boolean }> {
        const cachedMiniblocks: ParsedMiniblock[] = []
        try {
            for (let i = toExclusive - 1n; i >= fromInclusive; i = i - 1n) {
                const miniblock = await this.persistenceStore.getMiniblock(
                    streamIdAsString(streamId),
                    i,
                )
                if (miniblock) {
                    cachedMiniblocks.push(miniblock)
                    toExclusive = i
                } else {
                    break
                }
            }
            cachedMiniblocks.reverse()
        } catch (error) {
            this.logError('error getting miniblocks', error)
        }

        if (toExclusive === fromInclusive) {
            return {
                miniblocks: cachedMiniblocks,
                terminus: toExclusive === 0n,
            }
        }

        const { miniblocks, terminus } = await getMiniblocks(
            this.rpcClient,
            streamId,
            fromInclusive,
            toExclusive,
            this.opts?.unpackEnvelopeOpts,
        )

        await this.persistenceStore.saveMiniblocks(
            streamIdAsString(streamId),
            miniblocks,
            'backward',
        )

        return {
            terminus: terminus,
            miniblocks: [...miniblocks, ...cachedMiniblocks],
        }
    }

    async getMiniblockHeader(
        streamId: string,
        miniblockNum: bigint,
        unpackOpts: UnpackEnvelopeOpts | undefined = undefined,
    ): Promise<MiniblockHeader> {
        const response = await this.rpcClient.getMiniblockHeader({
            streamId: streamIdAsBytes(streamId),
            miniblockNum: miniblockNum,
        })
        check(isDefined(response.header), `header not found: ${streamId}`)
        const header = await unpackEnvelope(response.header, unpackOpts)
        check(
            header.event.payload.case === 'miniblockHeader',
            `bad miniblock header: wrong case received: ${header.event.payload.case}`,
        )
        return header.event.payload.value
    }

    async scrollback(
        streamId: string,
    ): Promise<{ terminus: boolean; firstEvent?: StreamTimelineEvent }> {
        const currentRequest = this.getScrollbackRequests.get(streamId)
        if (currentRequest) {
            return currentRequest
        }

        const _scrollback = async (): Promise<{
            terminus: boolean
            firstEvent?: StreamTimelineEvent
        }> => {
            const stream = this.stream(streamId)
            check(isDefined(stream), `stream not found: ${streamId}`)
            check(isDefined(stream.view.miniblockInfo), `stream not initialized: ${streamId}`)
            if (stream.view.miniblockInfo.terminusReached) {
                this.logCall('scrollback', streamId, 'terminus reached')
                return { terminus: true, firstEvent: stream.view.timeline.at(0) }
            }
            check(stream.view.miniblockInfo.min >= stream.view.prevSnapshotMiniblockNum)
            this.logCall('scrollback', {
                streamId,
                miniblockInfo: stream.view.miniblockInfo,
                prevSnapshotMiniblockNum: stream.view.prevSnapshotMiniblockNum,
            })
            const toExclusive = stream.view.miniblockInfo.min
            const fromInclusive = stream.view.prevSnapshotMiniblockNum
            const response = await this.getMiniblocks(streamId, fromInclusive, toExclusive)
            const eventIds = response.miniblocks.flatMap((m) => m.events.map((e) => e.hashStr))
            const cleartexts = await this.persistenceStore.getCleartexts(eventIds)

            // a race may occur here: if the state view has been reinitialized during the scrollback
            // request, we need to discard the new miniblocks.
            if ((stream.view.miniblockInfo?.min ?? -1n) === toExclusive) {
                stream.prependEvents(response.miniblocks, cleartexts, response.terminus)
                return { terminus: response.terminus, firstEvent: stream.view.timeline.at(0) }
            }
            return { terminus: false, firstEvent: stream.view.timeline.at(0) }
        }

        try {
            const request = _scrollback()
            this.getScrollbackRequests.set(streamId, request)
            return await request
        } finally {
            this.getScrollbackRequests.delete(streamId)
        }
    }

    /**
     * Get the list of active devices for all users in the room
     *
     *
     * @returns Promise which resolves to `null`, or an array whose
     *     first element is a {@link DeviceInfoMap} indicating
     *     the devices that messages should be encrypted to, and whose second
     *     element is a map from userId to deviceId to data indicating the devices
     *     that are in the room but that have been blocked.
     */
    async getDevicesInStream(stream_id: string): Promise<UserDeviceCollection> {
        let stream: IStreamStateView | undefined
        stream = this.stream(stream_id)?.view
        if (!stream || !stream.isInitialized) {
            stream = await this.getStream(stream_id)
        }
        if (!stream) {
            this.logError(`stream for room ${stream_id} not found`)
            return {}
        }
        const members = Array.from(stream.getUsersEntitledToKeyExchange())
        this.logCall(
            `Encrypting for users (shouldEncryptForInvitedMembers:`,
            members.map((u) => `${u} (${MembershipOp[MembershipOp.SO_JOIN]})`),
        )
        const info = await this.downloadUserDeviceInfo(members)
        this.logCall(
            'keys: ',
            Object.keys(info).map((key) => `${key} (${info[key].length})`),
        )
        return info
    }

    async getMiniblockInfo(
        streamId: string,
    ): Promise<{ miniblockNum: bigint; miniblockHash: Uint8Array }> {
        let streamView = this.stream(streamId)?.view
        // if we don't have a local copy, or if it's just not initialized, fetch the latest
        if (!streamView || !streamView.isInitialized) {
            streamView = await this.getStream(streamId)
        }
        check(isDefined(streamView), `stream not found: ${streamId}`)
        check(isDefined(streamView.miniblockInfo), `stream not initialized: ${streamId}`)
        check(isDefined(streamView.prevMiniblockHash), `prevMiniblockHash not found: ${streamId}`)
        return {
            miniblockNum: streamView.miniblockInfo.max,
            miniblockHash: streamView.prevMiniblockHash,
        }
    }

    async downloadNewInboxMessages(): Promise<void> {
        this.logCall('downloadNewInboxMessages')
        check(isDefined(this.userInboxStreamId))
        const stream = this.stream(this.userInboxStreamId)
        check(isDefined(stream))
        check(isDefined(stream.view.miniblockInfo))
        if (stream.view.miniblockInfo.terminusReached) {
            return
        }
        const deviceSummary =
            stream.view.userInboxContent.deviceSummary[this.userDeviceKey().deviceKey]
        if (!deviceSummary) {
            return
        }
        if (deviceSummary.lowerBound < stream.view.miniblockInfo.min) {
            const toExclusive = stream.view.miniblockInfo.min
            const fromInclusive = deviceSummary.lowerBound
            const response = await this.getMiniblocks(
                this.userInboxStreamId,
                fromInclusive,
                toExclusive,
            )
            const eventIds = response.miniblocks.flatMap((m) => m.events.map((e) => e.hashStr))
            const cleartexts = await this.persistenceStore.getCleartexts(eventIds)
            stream.prependEvents(response.miniblocks, cleartexts, response.terminus)
        }
    }

    public async downloadUserDeviceInfo(userIds: string[]): Promise<UserDeviceCollection> {
        // always fetch keys for arbitrarily small channels/dms/gdms. For large channels only
        // fetch keys if you don't already have keys, extended keysharing should work for those cases
        const forceDownload = userIds.length <= 10
        const promises = userIds.map(
            async (userId): Promise<{ userId: string; devices: UserDevice[] }> => {
                const streamId = makeUserMetadataStreamId(userId)
                try {
                    // also always download your own keys so you always share to your most up to date devices
                    if (!forceDownload && userId !== this.userId) {
                        const devicesFromStore = await this.cryptoStore.getUserDevices(userId)
                        if (devicesFromStore.length > 0) {
                            return { userId, devices: devicesFromStore }
                        }
                    }
                    // return latest 10 device keys
                    const deviceLookback = 10
                    const stream = await this.getStream(streamId)
                    const userDevices = stream.userMetadataContent.deviceKeys.slice(-deviceLookback)
                    await this.cryptoStore.saveUserDevices(userId, userDevices)
                    return { userId, devices: userDevices }
                } catch (e) {
                    this.logError('Error downloading user device keys', e)
                    return { userId, devices: [] }
                }
            },
        )

        return (await Promise.all(promises)).reduce((acc, current) => {
            acc[current.userId] = current.devices
            return acc
        }, {} as UserDeviceCollection)
    }

    public async knownDevicesForUserId(userId: string): Promise<UserDevice[]> {
        return await this.cryptoStore.getUserDevices(userId)
    }

    async makeEventAndAddToStream(
        streamId: string | Uint8Array,
        payload: PlainMessage<StreamEvent>['payload'],
        options: {
            method?: string
            localId?: string
            cleartext?: Uint8Array
            optional?: boolean
            tags?: PlainMessage<Tags>
        } = {},
    ): Promise<{ eventId: string; error?: AddEventResponse_Error }> {
        // TODO: filter this.logged payload for PII reasons
        this.logCall(
            'await makeEventAndAddToStream',
            options.method,
            streamId,
            payload,
            options.localId,
            options.optional,
        )
        assert(this.userStreamId !== undefined, 'userStreamId must be set')

        const stream = this.streams.get(streamId)
        assert(stream !== undefined, 'unknown stream ' + streamIdAsString(streamId))

        const prevHash = stream.view.prevMiniblockHash
        assert(
            isDefined(prevHash),
            'no prev miniblock hash for stream ' + streamIdAsString(streamId),
        )
        const { eventId, error } = await this.makeEventWithHashAndAddToStream(
            streamId,
            payload,
            prevHash,
            options.optional,
            options.localId,
            options.cleartext,
            options.tags,
        )
        return { eventId, error }
    }

    async makeEventWithHashAndAddToStream(
        streamId: string | Uint8Array,
        payload: PlainMessage<StreamEvent>['payload'],
        prevMiniblockHash: Uint8Array,
        optional?: boolean,
        localId?: string,
        cleartext?: Uint8Array,
        tags?: PlainMessage<Tags>,
        retryCount?: number,
    ): Promise<{ prevMiniblockHash: Uint8Array; eventId: string; error?: AddEventResponse_Error }> {
        const streamIdStr = streamIdAsString(streamId)
        check(isDefined(streamIdStr) && streamIdStr !== '', 'streamId must be defined')
        const event = await makeEvent(this.signerContext, payload, prevMiniblockHash, tags)
        const eventId = bin_toHexString(event.hash)
        if (localId) {
            // when we have a localId, we need to update the local event with the eventId
            const stream = this.streams.get(streamId)
            assert(stream !== undefined, 'unknown stream ' + streamIdStr)
            stream.updateLocalEvent(localId, eventId, 'sending')
        }

        if (cleartext) {
            // if we have cleartext, save it so we don't have to re-decrypt it later
            await this.persistenceStore.saveCleartext(eventId, cleartext)
        }

        try {
            const { error } = await this.rpcClient.addEvent({
                streamId: streamIdAsBytes(streamId),
                event,
                optional,
            })
            if (localId) {
                const stream = this.streams.get(streamId)
                stream?.updateLocalEvent(localId, eventId, 'sent')
            }
            return { prevMiniblockHash, eventId, error }
        } catch (err) {
            // custom retry logic for addEvent
            // if we send up a stale prevMiniblockHash, the server will return a BAD_PREV_MINIBLOCK_HASH
            // error and include the expected hash in the error message
            // if we had a localEventId, pass the last id so the ui can continue to update to the latest hash
            retryCount = retryCount ?? 0
            if (errorContains(err, Err.BAD_PREV_MINIBLOCK_HASH) && retryCount < 3) {
                const expectedHash = getRpcErrorProperty(err, 'expected')
                this.logInfo('RETRYING event after BAD_PREV_MINIBLOCK_HASH response', {
                    syncStats: this.streams.stats(),
                    retryCount,
                    prevMiniblockHash,
                    expectedHash,
                })
                check(isDefined(expectedHash), 'expected hash not found in error')
                return await this.makeEventWithHashAndAddToStream(
                    streamId,
                    payload,
                    bin_fromHexString(expectedHash),
                    optional,
                    isDefined(localId) ? eventId : undefined,
                    cleartext,
                    tags,
                    retryCount + 1,
                )
            } else {
                if (localId) {
                    const stream = this.streams.get(streamId)
                    stream?.updateLocalEvent(localId, eventId, 'failed')
                }
                throw err
            }
        }
    }

    // makeMediaEventWithHashAndAddToMediaStream is used for uploading media chunks to the media stream.
    // This function uses media stream specific RPC endpoints to upload media chunks.
    // These endpoints are optimized for media uploads and are not used for general stream events.
    async makeMediaEventWithHashAndAddToMediaStream(
        creationCookie: CreationCookie,
        last: boolean,
        payload: PlainMessage<StreamEvent>['payload'],
    ): Promise<{ creationCookie: CreationCookie }> {
        const streamIdStr = streamIdAsString(creationCookie.streamId)
        check(isDefined(streamIdStr) && streamIdStr !== '', 'streamId must be defined')
        const event = await makeEvent(this.signerContext, payload, creationCookie.prevMiniblockHash)

        const resp = await this.rpcClient.addMediaEvent({
            event,
            creationCookie,
            last,
        })

        check(isDefined(resp.creationCookie), 'creationCookie not found in response')

        return { creationCookie: resp.creationCookie }
    }

    async getStreamLastMiniblockHash(streamId: string | Uint8Array): Promise<Uint8Array> {
        const r = await this.rpcClient.getLastMiniblockHash({ streamId: streamIdAsBytes(streamId) })
        return r.hash
    }

    private async initCrypto(opts?: EncryptionDeviceInitOpts): Promise<void> {
        this.logCall('initCrypto')
        if (this.cryptoBackend) {
            this.logCall('Attempt to re-init crypto backend, ignoring')
            return
        }

        check(this.userId !== undefined, 'userId must be set to init crypto')

        await this.cryptoStore.initialize()

        const crypto = new GroupEncryptionCrypto(this, this.cryptoStore)
        await crypto.init(opts)
        this.cryptoBackend = crypto
        this.decryptionExtensions = new ClientDecryptionExtensions(
            this,
            crypto,
            this.entitlementsDelegate,
            this.userId,
            this.userDeviceKey(),
            this.opts?.unpackEnvelopeOpts,
            this.logId,
        )
    }

    /**
     * Resets crypto backend and creates a new encryption account, uploading device keys to UserDeviceKey stream.
     */
    async resetCrypto(): Promise<void> {
        this.logCall('resetCrypto')
        if (this.userId == undefined) {
            throw new Error('userId must be set to reset crypto')
        }
        this.cryptoBackend = undefined
        await this.decryptionExtensions?.stop()
        this.decryptionExtensions = undefined
        await this.cryptoStore.deleteAccount(this.userId)
        await this.initCrypto()
        await this.uploadDeviceKeys()
    }

    async uploadDeviceKeys() {
        check(isDefined(this.cryptoBackend), 'crypto backend not initialized')
        this.logCall('initCrypto:: uploading device keys...')

        check(isDefined(this.userMetadataStreamId))
        const stream = this.stream(this.userMetadataStreamId)
        check(isDefined(stream), 'device key stream not found')

        return this.makeEventAndAddToStream(
            this.userMetadataStreamId,
            make_UserMetadataPayload_EncryptionDevice({
                ...this.userDeviceKey(),
            }),
            { method: 'userDeviceKey' },
        )
    }

    async ackInboxStream() {
        check(isDefined(this.userInboxStreamId), 'user to device stream not found')
        check(isDefined(this.cryptoBackend), 'crypto backend not initialized')
        const inboxStream = this.streams.get(this.userInboxStreamId)
        check(isDefined(inboxStream), 'user to device stream not found')
        const miniblockNum = inboxStream?.view.miniblockInfo?.max
        check(isDefined(miniblockNum), 'miniblockNum not found')
        this.logCall('ackInboxStream:: acking received keys...')
        const previousAck =
            inboxStream.view.userInboxContent.deviceSummary[this.userDeviceKey().deviceKey]
        if (previousAck && previousAck.lowerBound >= miniblockNum) {
            this.logCall(
                'ackInboxStream:: already acked',
                previousAck,
                'miniblockNum:',
                miniblockNum,
            )
            return
        }
        await this.makeEventAndAddToStream(
            this.userInboxStreamId,
            make_UserInboxPayload_Ack({
                deviceKey: this.userDeviceKey().deviceKey,
                miniblockNum,
            }),
        )
    }

    public setHighPriorityStreams(streamIds: string[]) {
        this.logCall('setHighPriorityStreams', streamIds)
        this.decryptionExtensions?.setHighPriorityStreams(streamIds)
        this.syncedStreamsExtensions?.setHighPriorityStreams(streamIds)
        this.streams.setHighPriorityStreams(streamIds)
    }

    public async ensureOutboundSession(
        streamId: string,
        opts: { awaitInitialShareSession: boolean },
    ) {
        check(isDefined(this.cryptoBackend), 'crypto backend not initialized')
        return this.cryptoBackend.ensureOutboundSession(
            streamId,
            this.defaultGroupEncryptionAlgorithm,
            opts,
        )
    }

    /**
     * decrypts and updates the decrypted event
     */
    public async decryptGroupEvent(
        streamId: string,
        eventId: string,
        kind: string, // kind of data
        encryptedData: EncryptedData,
    ): Promise<void> {
        this.logCall('decryptGroupEvent', streamId, eventId, kind, encryptedData)
        const stream = this.stream(streamId)
        check(isDefined(stream), 'stream not found')
        check(isEncryptedContentKind(kind), `invalid kind ${kind}`)
        const cleartext = await this.cleartextForGroupEvent(streamId, eventId, encryptedData)
        const decryptedContent = toDecryptedContent(kind, encryptedData.version, cleartext)
        stream.updateDecryptedContent(eventId, decryptedContent)
    }

    private async cleartextForGroupEvent(
        streamId: string,
        eventId: string,
        encryptedData: EncryptedData,
    ): Promise<Uint8Array | string> {
        const cached = await this.persistenceStore.getCleartext(eventId)
        if (cached) {
            this.logDebug('Cache hit for cleartext', eventId)
            return cached
        }
        this.logDebug('Cache miss for cleartext', eventId)

        if (!this.cryptoBackend) {
            throw new Error('crypto backend not initialized')
        }
        const cleartext = await this.cryptoBackend.decryptGroupEvent(streamId, encryptedData)

        await this.persistenceStore.saveCleartext(eventId, cleartext)
        return cleartext
    }

    public async encryptAndShareGroupSessions(
        inStreamId: string | Uint8Array,
        sessions: GroupEncryptionSession[],
        toDevices: UserDeviceCollection,
        algorithm: GroupEncryptionAlgorithmId,
    ) {
        const streamIdStr = streamIdAsString(inStreamId)
        const streamIdBytes = streamIdAsBytes(inStreamId)
        check(isDefined(this.cryptoBackend), "crypto backend isn't initialized")
        check(sessions.length >= 0, 'no sessions to encrypt')
        check(
            new Set(sessions.map((s) => s.streamId)).size === 1,
            'sessions should all be from the same stream',
        )
        check(sessions[0].algorithm === algorithm, 'algorithm mismatch')
        check(
            new Set(sessions.map((s) => s.algorithm)).size === 1,
            'all sessions should be the same algorithm',
        )
        check(sessions[0].streamId === streamIdStr, 'streamId mismatch')

        this.logCall('share', { from: this.userId, to: toDevices })
        const userDevice = this.userDeviceKey()

        const sessionIds = sessions.map((session) => session.sessionId)
        const payload = makeSessionKeys(sessions)
        const payloadClearText = toJsonString(SessionKeysSchema, payload)
        const promises = Object.entries(toDevices).map(async ([userId, deviceKeys]) => {
            try {
                const ciphertext = await this.encryptWithDeviceKeys(payloadClearText, deviceKeys)
                if (Object.keys(ciphertext).length === 0) {
                    this.logCall('encryptAndShareGroupSessions: no ciphertext to send', userId)
                    return
                }
                const toStreamId: string = makeUserInboxStreamId(userId)
                const miniblockHash = await this.getStreamLastMiniblockHash(toStreamId)
                this.logCall("encryptAndShareGroupSessions: sent to user's devices", {
                    toStreamId,
                    deviceKeys: deviceKeys.map((d) => d.deviceKey).join(','),
                })
                await this.makeEventWithHashAndAddToStream(
                    toStreamId,
                    make_UserInboxPayload_GroupEncryptionSessions({
                        streamId: streamIdBytes,
                        senderKey: userDevice.deviceKey,
                        sessionIds: sessionIds,
                        ciphertexts: ciphertext,
                        algorithm: algorithm,
                    }),
                    miniblockHash,
                )
            } catch (error) {
                this.logError('encryptAndShareGroupSessions: ERROR', error)
                return undefined
            }
        })

        await Promise.all(promises)
    }

    // Encrypt event using GroupEncryption.
    public encryptGroupEvent(
        event: Uint8Array,
        streamId: string,
        algorithm: GroupEncryptionAlgorithmId,
    ): Promise<EncryptedData> {
        if (!this.cryptoBackend) {
            throw new Error('crypto backend not initialized')
        }

        return this.cryptoBackend.encryptGroupEvent(streamId, event, algorithm)
    }

    async encryptWithDeviceKeys(
        payloadClearText: string,
        deviceKeys: UserDevice[],
    ): Promise<Record<string, string>> {
        check(isDefined(this.cryptoBackend), 'crypto backend not initialized')

        // Don't encrypt to our own device
        return this.cryptoBackend.encryptWithDeviceKeys(
            payloadClearText,
            deviceKeys.filter((key) => key.deviceKey !== this.userDeviceKey().deviceKey),
        )
    }

    // Used during testing
    userDeviceKey(): UserDevice {
        if (!this.cryptoBackend) {
            throw new Error('cryptoBackend not initialized')
        }
        return this.cryptoBackend.getUserDevice()
    }

    public async debugForceMakeMiniblock(
        streamId: string,
        opts: { forceSnapshot?: boolean } = {},
    ): Promise<void> {
        await this.rpcClient.info({
            debug: ['make_miniblock', streamId, opts.forceSnapshot === true ? 'true' : 'false'],
        })
    }

    public async debugForceAddEvent(streamId: string, event: Envelope): Promise<void> {
        const jsonStr = toJsonString(EnvelopeSchema, event)
        await this.rpcClient.info({ debug: ['add_event', streamId, jsonStr] })
    }

    public async debugDropStream(syncId: string, streamId: string): Promise<void> {
        await this.rpcClient.info({ debug: ['drop_stream', syncId, streamId] })
    }
}

function ensureNoHexPrefix(value: string): string {
    return value.startsWith('0x') ? value.slice(2) : value
}
