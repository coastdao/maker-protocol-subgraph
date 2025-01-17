import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { describe, test, assert, clearStore } from 'matchstick-as'
import { LogNote } from '../../../../../generated/Pot/Pot'
import { handleDrip } from '../../../../../src/mappings/modules/rates/pot'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockChi, mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(): LogNote {
  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString('0x58326b7a'))
  let usr = tests.helpers.params.getBytes('usr', Bytes.fromUTF8(''))

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, usr]))
  event.block.timestamp = BigInt.fromI32(100)

  return event
}

describe('Pot#handleDrip', () => {
  test('Updates SystemState.rateAccumulator and SystemState.lastPotDripAt', () => {
    let event = createEvent()
    mockChi()

    handleDrip(event)

    assert.fieldEquals('SystemState', 'current', 'rateAccumulator', '10')
    assert.fieldEquals('SystemState', 'current', 'lastPotDripAt', event.block.timestamp.toString())

    clearStore()
  })
})
