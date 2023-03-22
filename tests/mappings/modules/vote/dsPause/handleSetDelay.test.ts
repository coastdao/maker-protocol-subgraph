import { Bytes, Address, ethereum, BigInt, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert, describe, beforeEach } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSPause/DSPause'
import { tests } from '../../../../../src/mappings/modules/tests'
import { handleSetDelay } from '../../../../../src/mappings/modules/vote/dsPause'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function strRadToBytes32(value: string): Bytes {
    const byteArray = Bytes.fromBigInt(BigInt.fromString(value))
    const filledArray = new Uint8Array(32)
    for (let byteArrayIndex = 0; byteArrayIndex < Math.min(31, byteArray.length); byteArrayIndex++) {
        filledArray[byteArrayIndex] = byteArray[byteArrayIndex]
    }
    return Bytes.fromUint8Array(filledArray.reverse())
}

function createEvent(delay: string): LogNote {
    const sig = Bytes.fromHexString("0xe177246e")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"
    const foo = strRadToBytes32(delay)
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

    return event;
}

describe("dsPause#handleSetDelay test", () => {
    test('dsPause#handleSetDelay succeeds', () => {
        const delay = "12345"
        const event = createEvent(delay)
        handleSetDelay(event)

        // assert VoteLog is not added
        const voteLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        assert.fieldEquals('VoteLogSetDelay', voteLogId, "delay_", delay)
        clearStore()
    })
})