import { Bytes, Address, ethereum, BigInt, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert, describe, beforeEach } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSPause/DSPause'
import { tests } from '../../../../../src/mappings/modules/tests'
import { handlePlot } from '../../../../../src/mappings/modules/vote/dsPause'
import { decodeTuple } from '../../../../../src/utils'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(usr: string, tag: string, faxArg: string, eta: string): LogNote {
    const sig = Bytes.fromHexString("0x46d2fbbb")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"

    let inputBytes: Bytes = new Bytes(0)
    const tuple4 = new ethereum.Tuple(4)
    tuple4[0] = ethereum.Value.fromAddress(Address.fromString(usr))
    tuple4[1] = ethereum.Value.fromFixedBytes(Bytes.fromHexString(tag))
    tuple4[2] = ethereum.Value.fromBytes(Bytes.fromHexString(faxArg))
    tuple4[3] = ethereum.Value.fromUnsignedBigInt(BigInt.fromString(eta))
    const encodedTuple = ethereum.encode(ethereum.Value.fromTuple(tuple4))
    if (encodedTuple) {
        // remove tuple tag
        inputBytes = Bytes.fromUint8Array(encodedTuple.slice(32))
    }

    const fax = sig.concat(inputBytes)
    const foo = Bytes.fromUint8Array(fax.slice(4, 36))
    const bar = Bytes.fromUint8Array(fax.slice(36, 68))

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

describe("dsPause#handlePlot test", () => {
    test("check decodeTuple works", () => {
        const fax = `0x000000000000000000000000231d51dbec6e3e63ad22078c73b70fbfd1b14265818fdbc388be4c94f5966634dc9271db7f9c75cd1ea999a0a59f0cfb960874630000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000303900000000000000000000000000000000000000000000000000000000000000080000123400005678000000000000000000000000000000000000000000000000`
        const decodedParams = decodeTuple("(address,bytes32,bytes,uint256)", Bytes.fromHexString(fax))
        assert.assertNotNull(decodedParams)
    })

    test('dsPause#handlePlot succeeds', () => {
        const usr = "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265"
        const tag = "0x818fdbc388be4c94f5966634dc9271db7f9c75cd1ea999a0a59f0cfb96087463"
        const fax = "0x0000123400005678"
        const eta = "12345"
        const event = createEvent(usr, tag, fax, eta)
        handlePlot(event)

        // assert VoteLog is not added
        const voteLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        assert.fieldEquals('VoteLogPlot', voteLogId, "usr", usr.toLowerCase())
        assert.fieldEquals('VoteLogPlot', voteLogId, "tag", tag)
        assert.fieldEquals('VoteLogPlot', voteLogId, "fax", fax)
        assert.fieldEquals('VoteLogPlot', voteLogId, "eta", eta)
        clearStore()
    })
})