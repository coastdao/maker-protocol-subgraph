import { Bytes, BigInt } from '@graphprotocol/graph-ts'
import { bytes } from '@protofire/subgraph-toolkit'
import { test, clearStore, assert, log } from 'matchstick-as'
import { CollateralType } from '../../../../../generated/schema'
import { LogNote } from '../../../../../generated/Spot/Spotter'
import { handleFile } from '../../../../../src/mappings/modules/core/spot'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function strRadToBytes(value: string): Bytes {
  return Bytes.fromUint8Array(Bytes.fromBigInt(BigInt.fromString(value)).reverse())
}

test('Spot#handleFile updates CollateralType.liquidationRatio when signature is 0x1a0b287e and what is mat', () => {
  let signature = '0x1a0b287e'
  let ilk = 'c1'
  let what = 'mat'
  let ray = '0x000000000000000000000000000000000004d8c55aefb8c05b5c000000000000' //25165824(000000000000000000000000000)

  let collateralType = new CollateralType(ilk)
  collateralType.save()

  let dataBytes = Bytes.fromHexString(signature)
  let ilkBytes = Bytes.fromUTF8(ilk)
  let whatBytes = Bytes.fromUTF8(what)
  dataBytes = dataBytes.concat(ilkBytes).concat(new Bytes(32 - ilkBytes.length))
  dataBytes = dataBytes.concat(whatBytes).concat(new Bytes(32 - whatBytes.length))
  dataBytes = dataBytes.concat(Bytes.fromHexString(ray))

  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString(signature))
  let arg1 = tests.helpers.params.getBytes('arg1', ilkBytes)
  let arg2 = tests.helpers.params.getBytes('arg2', whatBytes)
  let usr = tests.helpers.params.getBytes('usr', Bytes.fromUTF8(''))
  let data = tests.helpers.params.getBytes('data', dataBytes)

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, usr, arg1, arg2, data]))

  handleFile(event)

  assert.fieldEquals('CollateralType', ilk, 'liquidationRatio', '25165824')
  let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'contractType', "SPOT")
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterValue', '25165824')
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey2', ilk)
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey1', "mat")
})

test('Spot#handleFile creates SpotParLog when signature is 0x29ae8114 and what is par', () => {
  let signature = '0x29ae8114'
  let what = 'par'
  let amount = '0x0000000000000000000000000000000000000000033b2e3c9fd0803ce8000000' //1000000000000000000000000000

  let dataBytes = Bytes.fromHexString(signature)
  let whatBytes = Bytes.fromUTF8(what)
  dataBytes = dataBytes.concat(new Bytes(32))
  dataBytes = dataBytes.concat(whatBytes).concat(new Bytes(32 - whatBytes.length))
  dataBytes = dataBytes.concat(Bytes.fromHexString(amount))

  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString(signature))
  let arg1 = tests.helpers.params.getBytes('arg1', new Bytes(32))
  let arg2 = tests.helpers.params.getBytes('arg2', whatBytes)
  let usr = tests.helpers.params.getBytes('usr', Bytes.fromUTF8(''))
  let data = tests.helpers.params.getBytes('data', dataBytes)

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, usr, arg1, arg2, data]))

  handleFile(event)

  assert.fieldEquals('SpotParLog', event.transaction.hash.toHexString(), 'par', '1000000000000000000000000000')

  let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'contractType', "SPOT")
  assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterValue', "1000000000000000000000000000")
  assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey2', "")
  assert.fieldEquals('ProtocolParameterChangeLogBigInt', protocolParameterChangeLogId, 'parameterKey1', "par")
})

test('Spot#handleFile creates CollateralPrice when signature is 0xebecb39d and what is pip', () => {
  let signature = '0xebecb39d'
  let ilk = 'c1'
  let what = 'pip'
  let wad = '0x000000000000000000000000000000000004d8c55aefb8c05b5c000000000000' //25165824000000000...

  let collateralType = new CollateralType(ilk)
  collateralType.save()

  let dataBytes = Bytes.fromHexString(signature)
  let ilkBytes = Bytes.fromUTF8(ilk)
  let whatBytes = Bytes.fromUTF8(what)
  dataBytes = dataBytes.concat(ilkBytes).concat(new Bytes(32 - ilkBytes.length))
  dataBytes = dataBytes.concat(whatBytes).concat(new Bytes(32 - whatBytes.length))
  dataBytes = dataBytes.concat(Bytes.fromHexString(wad))

  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString(signature))
  let arg1 = tests.helpers.params.getBytes('arg1', ilkBytes)
  let arg2 = tests.helpers.params.getBytes('arg2', whatBytes)
  let usr = tests.helpers.params.getBytes('usr', Bytes.fromUTF8(''))
  let data = tests.helpers.params.getBytes('data', dataBytes)

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, usr, arg1, arg2, data]))

  handleFile(event)

  assert.fieldEquals('CollateralPrice', event.block.number.toString() + '-' + ilk, 'value', '25165824000000000')
  let protocolParameterChangeLogId = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'contractType', "SPOT")
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterValue', "25165824000000000")
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey2', ilk)
  assert.fieldEquals('ProtocolParameterChangeLogBigDecimal', protocolParameterChangeLogId, 'parameterKey1', "pip")

  clearStore()
})
