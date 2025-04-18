/**
 * @group main
 */

import { makeTestClient, makeUniqueSpaceStreamId, TestClient } from '../testUtils'

import { genShortId, makeUniqueChannelStreamId } from '../../id'
import { ChannelMessageSchema } from '@towns-protocol/proto'
import { GroupEncryptionAlgorithmId } from '@towns-protocol/encryption'
import { checkNever } from '@towns-protocol/web3'
import { create, toBinary } from '@bufbuild/protobuf'

describe('outboundSessionTests', () => {
    let bobsDeviceId: string
    let bobsClient: TestClient
    beforeEach(async () => {
        bobsDeviceId = genShortId()
        bobsClient = await makeTestClient({ deviceId: bobsDeviceId })
    })

    afterEach(async () => {
        await bobsClient.stop()
    })

    // This test is a bit of a false positive, since it's not actually using the IndexedDB
    // store, but instead the local-storage store.
    // should iterate over all the algorithms
    test.each(Object.values(GroupEncryptionAlgorithmId))(
        'sameOutboundSessionIsUsedBetweenClientSessions',
        async (algorithm) => {
            await expect(bobsClient.initializeUser()).resolves.not.toThrow()
            bobsClient.startSync()

            const spaceId = makeUniqueSpaceStreamId()
            await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()

            const channelId = makeUniqueChannelStreamId(spaceId)
            await expect(
                bobsClient.createChannel(spaceId, 'Channel', 'Topic', channelId),
            ).resolves.not.toThrow()
            await expect(bobsClient.waitForStream(channelId)).resolves.not.toThrow()

            const channelMessage = create(ChannelMessageSchema, {
                payload: {
                    case: 'post',
                    value: {
                        content: {
                            case: 'text',
                            value: { body: 'hello' },
                        },
                    },
                },
            })
            const buffer = toBinary(ChannelMessageSchema, channelMessage)

            const bobsOtherClient = await makeTestClient({
                context: bobsClient.signerContext,
                deviceId: bobsDeviceId,
            })
            await expect(bobsOtherClient.initializeUser()).resolves.not.toThrow()
            bobsOtherClient.startSync()

            const encrypted1 = await bobsClient.encryptGroupEvent(buffer, channelId, algorithm)
            const encrypted2 = await bobsOtherClient.encryptGroupEvent(buffer, channelId, algorithm)

            expect(encrypted1?.sessionId).toBeDefined()
            expect(encrypted1.sessionId).toEqual(encrypted2.sessionId)

            await bobsOtherClient.stop()
            await bobsClient.stop()
        },
    )

    // should iterate over all the algorithms
    test.each(Object.values(GroupEncryptionAlgorithmId))(
        'differentOutboundSessionIdsForDifferentStreams',
        async (algorithm) => {
            await expect(bobsClient.initializeUser()).resolves.not.toThrow()
            bobsClient.startSync()

            const spaceId = makeUniqueSpaceStreamId()
            await expect(bobsClient.createSpace(spaceId)).resolves.not.toThrow()

            const channelId1 = makeUniqueChannelStreamId(spaceId)
            await expect(
                bobsClient.createChannel(spaceId, '', '', channelId1),
            ).resolves.not.toThrow()
            await expect(bobsClient.waitForStream(channelId1)).resolves.not.toThrow()

            const channelId2 = makeUniqueChannelStreamId(spaceId)
            await expect(
                bobsClient.createChannel(spaceId, '', '', channelId2),
            ).resolves.not.toThrow()
            await expect(bobsClient.waitForStream(channelId2)).resolves.not.toThrow()

            const channelMessage = create(ChannelMessageSchema, {
                payload: {
                    case: 'post',
                    value: {
                        content: {
                            case: 'text',
                            value: { body: 'hello' },
                        },
                    },
                },
            })
            const buffer = toBinary(ChannelMessageSchema, channelMessage)

            const encryptedChannel1_1 = await bobsClient.encryptGroupEvent(
                buffer,
                channelId1,
                algorithm,
            )
            const encryptedChannel1_2 = await bobsClient.encryptGroupEvent(
                buffer,
                channelId1,
                algorithm,
            )
            const encryptedChannel2_1 = await bobsClient.encryptGroupEvent(
                buffer,
                channelId2,
                algorithm,
            )

            switch (algorithm) {
                case GroupEncryptionAlgorithmId.GroupEncryption:
                    expect(encryptedChannel1_1?.sessionId).toBeDefined()
                    expect(encryptedChannel1_1?.sessionId).not.toEqual('')
                    expect(encryptedChannel1_2?.sessionId).toBeDefined()
                    expect(encryptedChannel1_2?.sessionId).not.toEqual('')
                    expect(encryptedChannel1_1.sessionId).toEqual(encryptedChannel1_2.sessionId)
                    expect(encryptedChannel1_1.sessionId).not.toEqual(encryptedChannel2_1.sessionId)
                    break
                case GroupEncryptionAlgorithmId.HybridGroupEncryption:
                    expect(encryptedChannel1_1?.sessionIdBytes).toBeDefined()
                    expect(encryptedChannel1_1?.sessionIdBytes).not.toEqual(new Uint8Array())
                    expect(encryptedChannel1_2?.sessionIdBytes).toBeDefined()
                    expect(encryptedChannel1_2?.sessionIdBytes).not.toEqual(new Uint8Array())
                    expect(encryptedChannel1_1.sessionIdBytes).toEqual(
                        encryptedChannel1_2.sessionIdBytes,
                    )
                    expect(encryptedChannel1_1.sessionIdBytes).not.toEqual(
                        encryptedChannel2_1.sessionIdBytes,
                    )
                    break
                default:
                    checkNever(algorithm)
            }

            const x = bobsClient.cryptoBackend?.hasSessionKey(
                channelId1,
                encryptedChannel1_1.sessionId,
                algorithm,
            )
            expect(x).toBeDefined()
        },
    )
})
