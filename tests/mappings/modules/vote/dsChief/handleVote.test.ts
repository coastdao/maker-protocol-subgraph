import { Bytes, Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSChief/DSChief'
import { handleVote } from '../../../../../src/mappings/modules/vote/dsChief'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule, users, votes } from '../../../../../src/entities'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(slate: string): LogNote {

    const sig = Bytes.fromHexString("0xa69beaba")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"
    const foo = Bytes.fromHexString(slate)
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

test('dsChief#handleVote process event if directly called', () => {
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

    // prepare slate 2, new slate
    const voteSlateId2 = "0xc83dda2479cc098004e11fb2f1872300dd53bdb97e209d9515e52a94b4413026"
    const voteSlate2 = votes.loadOrCreateVoteSlate(voteSlateId2)
    voteSlate2.addresses = [
        Bytes.fromHexString("0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265"),
        Bytes.fromHexString("0xe07351ecc2c326400b0ea49f1c45a94ff1b6ada8"),
        Bytes.fromHexString("0xf71b70a4af37a8f8ab570cb77b542560d7285aec"),
    ]
    voteSlate2.save()

    // create event
    const event = createEvent(voteSlateId2)

    // prepare user
    const user = users.getOrCreateUser(event.transaction.from)
    user.voteSlate = voteSlateId1
    user.voteWeight = BigInt.fromString(voteWeight);
    user.save()

    // prepare system hat
    let system = systemModule.getSystemState(event)
    const hat = "0x0000"
    system.hat = hat
    system.save()

    // run handler
    handleVote(event)

    // assert VoteLogVote is added
    const voteLogId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString() + "-vote"
    assert.fieldEquals('VoteLogVote', voteLogId, 'hat', hat)

    // assert VoteApproval is added
    assert.fieldEquals('VoteApproval', "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265".toLowerCase(), 'approvals', voteWeight)
    assert.fieldEquals('VoteApproval', "0xe07351ecc2c326400b0ea49f1c45a94ff1b6ada8".toLowerCase(), 'approvals', voteWeight)
    assert.fieldEquals('VoteApproval', "0xf71b70a4af37a8f8ab570cb77b542560d7285aec".toLowerCase(), 'approvals', voteWeight)
    assert.fieldEquals('VoteApproval', "0x33828c8c03c0975669d358297ad1e7413da8bf3e".toLowerCase(), 'approvals', "0")
    assert.fieldEquals('VoteApproval', "0xdafa56dde6a66dc1bb2418ee7bf9087e8daf16f3".toLowerCase(), 'approvals', "0")

    clearStore()
})