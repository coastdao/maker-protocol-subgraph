import { Bytes, Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSChief/DSChief'
import { handleEtch } from '../../../../../src/mappings/modules/vote/dsChief'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule } from '../../../../../src/entities'
import { VoteLogEtch } from '../../../../../generated/schema'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(addressList: string[]): LogNote {

    const sig = Bytes.fromHexString("0x5123e1fa")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"
    const yays: Address[] = addressList.map<Address>(address => Address.fromBytes(Bytes.fromHexString(address)))
    const encodedArray = ethereum.encode(ethereum.Value.fromAddressArray(yays))
    const fax = sig.concat(encodedArray ? encodedArray : new Bytes(0))
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

test('dsChief#handleEtch process event if old log does not exist', () => {
    const addressList = [
        "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265",
        "0x33828c8c03c0975669d358297ad1e7413da8bf3e",
        "0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3",
        "0xf71b70a4af37a8f8ab570cb77b542560d7285aec"
    ]
    const event = createEvent(addressList)

    // prepare system hat
    let system = systemModule.getSystemState(event)
    const hat = "0x000"
    system.hat = hat
    system.save()

    // run handler
    handleEtch(event)

    const voteLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-etch"
    const voteSlateId = "0x818fdbc388be4c94f5966634dc9271db7f9c75cd1ea999a0a59f0cfb96087463"

    // assert VoteLogEtch is added
    assert.fieldEquals('VoteLogEtch', voteLogId, 'hat', hat)

    // assert VoteSlate is added
    const addressListString = "[" + addressList.map<string>(a => a.toLowerCase()).join(", ") + "]"
    assert.fieldEquals('VoteSlate', voteSlateId, 'addresses', addressListString)

    clearStore()
})

test('dsChief#handleEtch process event does execute even if old log exists, because it\'s handleEtch and not handleEtchAndVote', () => {
    const addressList = [
        "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265",
        "0x33828c8c03c0975669d358297ad1e7413da8bf3e",
        "0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3",
        "0xf71b70a4af37a8f8ab570cb77b542560d7285aec"
    ]
    const event = createEvent(addressList)

    // prepare system hat
    let system = systemModule.getSystemState(event)
    const hat = "0x000"
    system.hat = hat
    system.save()

    // prepare old log
    const oldVoteLogId = event.transaction.hash.toHex() + '-' + (event.logIndex.minus(BigInt.fromString("1"))).toString() + "-etch"
    const oldVoteLog = new VoteLogEtch(oldVoteLogId)
    oldVoteLog.save()

    // run handler
    handleEtch(event)

    // assert VoteLogEtch is added
    const voteLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-etch"
    assert.fieldEquals('VoteLogEtch', voteLogId, 'hat', hat)

    clearStore()
})
