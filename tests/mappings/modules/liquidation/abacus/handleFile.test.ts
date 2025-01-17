import { Bytes, BigInt } from '@graphprotocol/graph-ts'
import { afterAll, beforeAll, clearStore, describe, test, assert } from 'matchstick-as'
import { File } from '../../../../../generated/StairstepExponentialDecrease/StairstepExponentialDecrease'
import { handleFile } from '../../../../../src/mappings/modules/liquidation/abacus'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

describe('Abacus#handleFile', () => {
  describe('When [what] = cut', () => {
    test('Updates secondsBetweenPriceDrops in SystemState', () => {
      let what = 'cut'
      let data = '11' // 11 seconds

      let event = changetype<File>(
        tests.helpers.events.getNewEvent([
          tests.helpers.params.getBytes('what', Bytes.fromUTF8(what)),
          tests.helpers.params.getBigInt('data', BigInt.fromString(data)),
        ]),
      )

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'secondsBetweenPriceDrops', '11')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'contractType', "ABACUS")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterValue', data)
    })
  })

  describe('When [what] = step', () => {
    test('Updates multiplicatorFactorPerStep in SystemState', () => {
      let what = 'step'
      let data = '11000000000000000000000000000' // 11 ray

      let event = changetype<File>(
        tests.helpers.events.getNewEvent([
          tests.helpers.params.getBytes('what', Bytes.fromUTF8(what)),
          tests.helpers.params.getBigInt('data', BigInt.fromString(data)),
        ]),
      )

      handleFile(event)

      assert.fieldEquals('SystemState', 'current', 'multiplicatorFactorPerStep', '11')
      let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'contractType', "ABACUS")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey1', what)
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey2', "")
      assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterValue', "11")

    })
  })

  afterAll(() => {
    clearStore()
  })
})
