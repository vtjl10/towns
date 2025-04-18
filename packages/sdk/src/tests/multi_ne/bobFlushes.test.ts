/**
 * @group main
 */

import { bobTalksToHimself } from '../bob_testUtils'
import { dlog } from '@towns-protocol/dlog'
import { makeRandomUserContext } from '../testUtils'
import { SignerContext } from '../../signerContext'

const baseLog = dlog('csb:test:bobFlushes')

describe('bobFlushes', () => {
    let bobsContext: SignerContext

    beforeEach(async () => {
        bobsContext = await makeRandomUserContext()
    })

    test('bobTalksToHimself-noflush-nopresync', async () => {
        await bobTalksToHimself(
            baseLog.extend('bobTalksToHimself-noflush-nopresync'),
            bobsContext,
            false,
            false,
        )
    })
    test('bobTalksToHimself-noflush-presync', async () => {
        await bobTalksToHimself(
            baseLog.extend('bobTalksToHimself-noflush-presync'),
            bobsContext,
            false,
            true,
        )
    })
})
