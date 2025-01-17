import { Bytes, BigInt } from '@graphprotocol/graph-ts'
import { test, clearStore, assert, log, describe } from 'matchstick-as'
import { LogNote } from '../../../../../generated/Flop/Flopper'
import { handleFile } from '../../../../../src/mappings/modules/system-stabilizer/flop'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(what: string, data: string): LogNote {
  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString('0x1a0b287e'))
  let arg1 = tests.helpers.params.getBytes('arg1', Bytes.fromUTF8(''))
  let dataBytes = Bytes.fromUint8Array(Bytes.fromBigInt(BigInt.fromString(data)).reverse())
  let arg2 = tests.helpers.params.getBytes('arg2', Bytes.fromUTF8(what))
  let arg3 = tests.helpers.params.getBytes('arg3', dataBytes)

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, arg1, arg2, arg3]))

  return event
}

describe('Flopper#handleFile', () => {
  describe("When [what] is 'beg'", () => {
    test('Updates SystemState.debtAuctionMinimumBidIncrease', () => {
      let what = 'beg'
      let data = '100000000000000000000' // 100 wad

      let event = createEvent(what, data)

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'debtAuctionMinimumBidIncrease', '100')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'contractType', "FLOP")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterValue', "100")

      clearStore()
    })
  })

  describe("When [what] is 'pad'", () => {
    test('Updates SystemState.debtAuctionMinimumBidIncrease', () => {
      let what = 'pad'
      let data = '100000000000000000000' // 100 wad

      let event = createEvent(what, data)

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'debtAuctionLotSizeIncrease', '100')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'contractType', "FLOP")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterValue', "100")

      clearStore()
    })
  })

  describe("When [what] is 'ttl'", () => {
    test('Updates SystemState.debtAuctionBidDuration', () => {
      let what = 'ttl'
      let data = '60' // 60 seconds

      let event = createEvent(what, data)

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'debtAuctionBidDuration', '60')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'contractType', "FLOP")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterValue', "60")

      clearStore()
    })
  })

  describe("When [what] is 'tau'", () => {
    test('Updates SystemState.debtAuctionDuration', () => {
      let what = 'tau'
      let data = '60' // 60 seconds

      let event = createEvent(what, data)

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'debtAuctionDuration', '60')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'contractType', "FLOP")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterValue', "60")

      clearStore()
    })
  })
})
