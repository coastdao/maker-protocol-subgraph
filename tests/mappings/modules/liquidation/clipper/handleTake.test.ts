import { Address, BigInt } from '@graphprotocol/graph-ts'
import { test, assert, clearStore, describe, afterAll } from 'matchstick-as'
import { tests } from '../../../../../src/mappings/modules/tests'
import { Take as TakeEvent } from '../../../../../generated/ClipperEth/Clipper'
import { handleTake } from '../../../../../src/mappings/modules/liquidation/clipper'
import { saleAuctions } from '../../../../../src/entities'

function createSaleAuction(id: string, event: TakeEvent): void {
  let idStr = id.toString()

  event.block.timestamp = BigInt.fromI32(1)
  let saleAuction = saleAuctions.loadOrCreateSaleAuction(idStr, event)
  saleAuction.isActive = true
  saleAuction.save()
}

describe('Clipper#handleTake', () => {
  describe('When [lot] is 0', () => {
    test('Set isActive to false from SaleAuction', () => {
      let id = BigInt.fromString('2')
      let max = BigInt.fromString('10000000000000000000000000000') // 10 ray
      let price = BigInt.fromString('11000000000000000000000000000') // 11 ray
      let owe = BigInt.fromString('1000000000000000000000000000') // 1 ray
      let tab = BigInt.fromString('5000000000000000000000000000000000000000000000') // 5 rad
      let lot = BigInt.fromString('0') // 0 wad
      let usr = Address.fromString('0x0000000000000000000000000000000000001111')
      let event = changetype<TakeEvent>(
        tests.helpers.events.getNewEvent([
          tests.helpers.params.getBigInt('id', id),
          tests.helpers.params.getBigInt('max', max),
          tests.helpers.params.getBigInt('price', price),
          tests.helpers.params.getBigInt('owe', owe),
          tests.helpers.params.getBigInt('tab', tab),
          tests.helpers.params.getBigInt('lot', lot),
          tests.helpers.params.getAddress('usr', usr),
        ]),
      )
      const idStr = id.toString() + "-" + event.address.toHexString()
      createSaleAuction(idStr, event)

      event.block.timestamp = BigInt.fromI32(1001)

      handleTake(event)

      assert.fieldEquals('SaleAuction', idStr, 'isActive', 'false')
      assert.fieldEquals('SaleAuction', idStr, 'updatedAt', '1001')
    })
  })

  describe('When [tab] is 0', () => {
    test('Set isActive to false from SaleAuction', () => {
      let id = BigInt.fromString('2')
      let max = BigInt.fromString('10000000000000000000000000000') // 10 ray
      let price = BigInt.fromString('11000000000000000000000000000') // 11 ray
      let owe = BigInt.fromString('1000000000000000000000000000') // 1 ray
      let tab = BigInt.fromString('0') // 0 rad
      let lot = BigInt.fromString('101000000000000000000') // 101 wad
      let usr = Address.fromString('0x0000000000000000000000000000000000001111')
      let event = changetype<TakeEvent>(
        tests.helpers.events.getNewEvent([
          tests.helpers.params.getBigInt('id', id),
          tests.helpers.params.getBigInt('max', max),
          tests.helpers.params.getBigInt('price', price),
          tests.helpers.params.getBigInt('owe', owe),
          tests.helpers.params.getBigInt('tab', tab),
          tests.helpers.params.getBigInt('lot', lot),
          tests.helpers.params.getAddress('usr', usr),
        ]),
      )
      const idStr = id.toString() + "-" + event.address.toHexString()
      createSaleAuction(idStr, event)

      event.block.timestamp = BigInt.fromString('1001')

      handleTake(event)

      assert.fieldEquals('SaleAuction', idStr, 'isActive', 'false')
      assert.fieldEquals('SaleAuction', idStr, 'updatedAt', '1001')
    })
  })

  describe('When [tab] and [lot] are not 0', () => {
    test('Updates from SaleAuction the fields amountDaiToRaise, amountCollateralToSell, boughtAt & updatedAt', () => {
      let id = BigInt.fromString('2')
      let max = BigInt.fromString('10000000000000000000000000000') // 10 ray
      let price = BigInt.fromString('11000000000000000000000000000') // 11 ray
      let owe = BigInt.fromString('1000000000000000000000000000') // 1 ray
      let tab = BigInt.fromString('5000000000000000000000000000000000000000000000') // 5 rad
      let lot = BigInt.fromString('101000000000000000000') // 101 wad
      let usr = Address.fromString('0x0000000000000000000000000000000000001111')
      let event = changetype<TakeEvent>(
        tests.helpers.events.getNewEvent([
          tests.helpers.params.getBigInt('id', id),
          tests.helpers.params.getBigInt('max', max),
          tests.helpers.params.getBigInt('price', price),
          tests.helpers.params.getBigInt('owe', owe),
          tests.helpers.params.getBigInt('tab', tab),
          tests.helpers.params.getBigInt('lot', lot),
          tests.helpers.params.getAddress('usr', usr),
        ]),
      )

      const idStr = id.toString() + "-" + event.address.toHexString()
      createSaleAuction(idStr, event)

      event.block.timestamp = BigInt.fromI32(1001)

      handleTake(event)
      // default address internally used by matchstick framework
      // https://github.com/LimeChain/matchstick-as/blob/ce1cb9dfb7c3ed3d60eef5a3ef3134798fe71364/assembly/defaults.ts#L3
      let senderAddress = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a'

      assert.fieldEquals('SaleAuction', idStr, 'amountDaiToRaise', '5')
      assert.fieldEquals('SaleAuction', idStr, 'amountCollateralToSell', '101')
      assert.fieldEquals('SaleAuction', idStr, 'updatedAt', '1001')
      assert.fieldEquals('SaleAuction', idStr, 'boughtAt', '1001')
      assert.fieldEquals('SaleAuction', idStr, 'userTaker', senderAddress)
    })
  })

  afterAll(() => {
    clearStore()
  })
})
