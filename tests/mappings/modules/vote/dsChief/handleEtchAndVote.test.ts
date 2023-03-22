import { Bytes, Address, ethereum, BigInt, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert, describe, beforeEach } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSChief/DSChief'
import { handleEtchAndVote } from '../../../../../src/mappings/modules/vote/dsChief'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule, votes, users } from '../../../../../src/entities'
import { VoteLogEtch, VoteLogVote } from '../../../../../generated/schema'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(addressList: string[]): LogNote {

    const sig = Bytes.fromHexString("0xed081329")
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

describe("dsChief test", () => {
    test('dsChief#handleEtchAndVote process event if old log does not exist', () => {
        const voteWeight = "10000";

        // prepare slate 1, user slate
        const voteSlateId1 = "0x818fdbc388be4c94f5966634dc9271db7f9c75cd1ea999a0a59f0cfb96087463"
        const voteSlate1 = votes.loadOrCreateVoteSlate(voteSlateId1)
        voteSlate1.addresses = [
            Bytes.fromHexString("0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265"),
            Bytes.fromHexString("0x33828c8c03c0975669d358297ad1e7413da8bf3e"),
            Bytes.fromHexString("0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3"),
            Bytes.fromHexString("0xf71b70a4af37a8f8ab570cb77b542560d7285aec"),
        ]
        voteSlate1.save()

        // prepare current user approvals
        voteSlate1.addresses.map<boolean>((address: Bytes) => {
            const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
            voteApproval.approvals = BigInt.fromString(voteWeight)
            voteApproval.save()
            return true;
        })

        // create event, etch and vote
        const addressList = [
            "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265",
            "0xe07351ecc2c326400b0ea49f1c45a94ff1b6ada8",
            "0xf71b70a4af37a8f8ab570cb77b542560d7285aec",
        ]
        const event = createEvent(addressList)

        // prepare system hat
        let system = systemModule.getSystemState(event)
        const hat = "0x000"
        system.hat = hat
        system.save()

        // prepare user
        const user = users.getOrCreateUser(event.transaction.from)
        user.voteSlate = voteSlateId1
        user.voteWeight = BigInt.fromString(voteWeight);
        user.save()

        // run handler
        handleEtchAndVote(event)

        // assert VoteLogEtch is added
        const voteLogEtchId = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-etch"
        assert.fieldEquals('VoteLogEtch', voteLogEtchId, 'hat', hat)

        // assert VoteLogVote is added
        const voteLogVoteId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + "-vote"
        assert.fieldEquals('VoteLogVote', voteLogVoteId, 'hat', hat)

        // assert VoteSlate is added
        const voteSlateId = "0xc83dda2479cc098004e11fb2f1872300dd53bdb97e209d9515e52a94b4413026"
        const addressListString = "[" + addressList.map<string>(a => a.toLowerCase()).join(", ") + "]"
        assert.fieldEquals('VoteSlate', voteSlateId, 'addresses', addressListString)

        // assert VoteApproval is added
        assert.fieldEquals('VoteApproval', "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265".toLowerCase(), 'approvals', voteWeight)
        assert.fieldEquals('VoteApproval', "0xe07351ecc2c326400b0ea49f1c45a94ff1b6ada8".toLowerCase(), 'approvals', voteWeight)
        assert.fieldEquals('VoteApproval', "0xf71b70a4af37a8f8ab570cb77b542560d7285aec".toLowerCase(), 'approvals', voteWeight)
        assert.fieldEquals('VoteApproval', "0x33828c8c03c0975669d358297ad1e7413da8bf3e".toLowerCase(), 'approvals', "0")
        assert.fieldEquals('VoteApproval', "0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3".toLowerCase(), 'approvals', "0")

        clearStore()
    })

    test('dsChief#handleEtchAndVote process event does not log new one if old log exists', () => {
        const voteWeight = "10000";

        // prepare slate 1, user slate
        const voteSlateId1 = "0x818fdbc388be4c94f5966634dc9271db7f9c75cd1ea999a0a59f0cfb96087463"
        const voteSlate1 = votes.loadOrCreateVoteSlate(voteSlateId1)
        voteSlate1.addresses = [
            Bytes.fromHexString("0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265"),
            Bytes.fromHexString("0x33828c8c03c0975669d358297ad1e7413da8bf3e"),
            Bytes.fromHexString("0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3"),
            Bytes.fromHexString("0xf71b70a4af37a8f8ab570cb77b542560d7285aec"),
        ]
        voteSlate1.save()

        // prepare current user approvals
        voteSlate1.addresses.map<boolean>((address: Bytes) => {
            const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
            voteApproval.approvals = BigInt.fromString(voteWeight)
            voteApproval.save()
            return true;
        })

        // create event, etch and vote
        const addressList = [
            "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265",
            "0xe07351ecc2c326400b0ea49f1c45a94ff1b6ada8",
            "0xf71b70a4af37a8f8ab570cb77b542560d7285aec",
        ]
        const event = createEvent(addressList)

        // prepare system hat
        let system = systemModule.getSystemState(event)
        const hat = "0x000"
        system.hat = hat
        system.save()

        // prepare user
        const user = users.getOrCreateUser(event.transaction.from)
        user.voteSlate = voteSlateId1
        user.voteWeight = BigInt.fromString(voteWeight);
        user.save()

        // prepare old etch log
        const oldVoteLogEtchId = event.transaction.hash.toHex() + '-' + (event.logIndex.minus(BigInt.fromString("1"))).toString() + "-etch"
        const oldVoteLogEtch = new VoteLogEtch(oldVoteLogEtchId)
        oldVoteLogEtch.save()

        // prepare old vote log
        const oldVoteLogVoteId = event.transaction.hash.toHex() + '-' + (event.logIndex.minus(BigInt.fromString("1"))).toString() + "-vote"
        const oldVoteLogVote = new VoteLogVote(oldVoteLogVoteId)
        oldVoteLogVote.save()

        // run handler
        handleEtchAndVote(event)

        // assert VoteLogEtch is not added
        const voteLogEtchId = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-etch"
        assert.notInStore('VoteLogEtch', voteLogEtchId)

        // assert VoteLogVote is not added
        const voteLogVoteId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + "-vote"
        assert.notInStore('VoteLogVote', voteLogVoteId)

        clearStore()
    })
})


