import { BigInt } from '@graphprotocol/graph-ts'
import { clearStore, describe, test, beforeEach, afterEach, assert } from 'matchstick-as'
import { Yank as YankEvent } from '../../../../../generated/ClipperEth/Clipper'
import { tests } from '../../../../../src/mappings/modules/tests'
import { handleYank } from '../../../../../src/mappings/modules/liquidation/clipper'
import { saleAuctions } from '../../../../../src/entities'

function createEvent(id: string): YankEvent {
  return changetype<YankEvent>(
    tests.helpers.events.getNewEvent([tests.helpers.params.getBigInt('id', BigInt.fromString(id))]),
  )
}

function createSaleAuction(id: string, event: YankEvent): void {
  let idStr = id.toString()

  event.block.timestamp = BigInt.fromI32(1)
  let saleAuction = saleAuctions.loadOrCreateSaleAuction(idStr, event)
  saleAuction.isActive = true
  saleAuction.save()
}

describe('Clipper#handleYank', () => {
  afterEach(() => {
    clearStore()
  })

  describe('when SaleAuction exists', () => {

    test('soft deletes the SaleAuction', () => {
      const saleAuctionId = '1234'
      let event = createEvent(saleAuctionId)
      const idStr = saleAuctionId + "-" + event.address.toHexString()
      createSaleAuction(idStr, event)

      handleYank(event)

      assert.fieldEquals('SaleAuction', idStr, 'deletedAt', event.block.timestamp.toString())
      assert.fieldEquals('SaleAuction', idStr, 'isActive', 'false')
    })
  })

  describe('when SaleAuction does not exist', () => {
    test('does not create it', () => {
      const saleAuctionId = '3456'
      let event = createEvent(saleAuctionId)
      const idStr = saleAuctionId + "-" + event.address.toHexString()

      handleYank(event)

      assert.notInStore('SaleAuction', idStr)
    })
  })
})
