import { Bytes, Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { test, clearStore, assert } from 'matchstick-as'
import { LogNote } from '../../../../../generated/DSChief/DSChief'
import { handleLift } from '../../../../../src/mappings/modules/vote/dsChief'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule } from '../../../../../src/entities'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(hat: string): LogNote {

    const sig = Bytes.fromHexString("0x3c278bd5")
    const guy = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"
    const wad = "0"
    const encodedHat = ethereum.encode(ethereum.Value.fromAddress(Address.fromString(hat)))
    const fax = sig.concat(encodedHat ? encodedHat : new Bytes(32))
    const foo = new Bytes(32)
    const bar = new Bytes(32)

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

test('dsChief#handleLift process event', () => {
    const hat = "0x231d51dbeC6E3E63Ad22078C73B70fBfD1b14265"
    const event = createEvent(hat)

    // prepare system hat
    let system = systemModule.getSystemState(event)
    system.hat = hat
    system.save()

    // run handler
    handleLift(event)

    // assert VoteLog is added
    const voteLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
    assert.fieldEquals('VoteLogLift', voteLogId, 'hat', hat.toLowerCase())
    assert.fieldEquals('SystemState', "current", 'hat', hat.toLowerCase())

    clearStore()
})
