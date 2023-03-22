import { Bytes, Address, BigInt, ethereum, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSChief/DSChief'
import { handleLaunch } from '../../../../../src/mappings/modules/vote/dsChief'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule } from '../../../../../src/entities'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

test('dsChief#handleLaunch process event', () => {
    const sig = Bytes.fromHexString("0x01339c21")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"
    const foo = new Bytes(32)
    const bar = new Bytes(32)
    const fax = sig.concat(foo).concat(bar)

    let event = changetype<LogNote>(tests.helpers.events.getNewEvent([
        tests.helpers.params.getBytes('sig', sig),
        tests.helpers.params.getAddress('guy', Address.fromString(guy)),
        tests.helpers.params.getBytes('foo', foo),
        tests.helpers.params.getBytes('bar', bar),
        tests.helpers.params.getBigInt('wad', BigInt.fromString(wad)),
        tests.helpers.params.getBytes('fax', fax),
    ]))

    let system = systemModule.getSystemState(event)
    const hat = "0x000"
    system.hat = hat
    system.save()

    handleLaunch(event)

    const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()

    assert.fieldEquals('VoteLogLaunch', id, 'hat', hat)
    assert.fieldEquals('VoteLogLaunch', id, 'sender', guy)
    clearStore()
})
