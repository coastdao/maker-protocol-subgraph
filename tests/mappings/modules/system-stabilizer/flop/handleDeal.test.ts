import { Bytes, BigInt } from '@graphprotocol/graph-ts'
import { test, clearStore, assert, describe } from 'matchstick-as'
import { LogNote } from '../../../../../generated/Flop/Flopper'
import { handleDeal } from '../../../../../src/mappings/modules/system-stabilizer/flop'
import { tests } from '../../../../../src/mappings/modules/tests'
import { auctions } from '../../../../../src/entities'

function createEvent(id: BigInt): LogNote {
  let sig = tests.helpers.params.getBytes('sig', Bytes.fromHexString('0xc959c42b'))
  let arg1 = tests.helpers.params.getBytes('arg1', Bytes.fromUTF8(''))
  let radBytes = Bytes.fromUint8Array(Bytes.fromBigInt(id).reverse())
  let arg2 = tests.helpers.params.getBytes('arg2', radBytes)

  let event = changetype<LogNote>(tests.helpers.events.getNewEvent([sig, arg1, arg2]))

  return event
}

describe('Flopper#handleDeal', () => {
  test('Updates Auction.active and Auction.deletedAt ', () => {
    let id = BigInt.fromString('50')
    let auctionId = id
      .toString()
      .concat('-')
      .concat('debt')

    let event = createEvent(id)

    let auction = auctions.loadOrCreateDebtAuction(auctionId, event) // load the Auction with the quantity value
    auction.endTimeAt = event.block.timestamp
    auction.highestBidder = event.transaction.from
    auction.quantity = BigInt.fromString('100')
    auction.updatedAt = BigInt.fromI32(0)
    auction.save()

    handleDeal(event)

    assert.fieldEquals('DebtAuction', auctionId, 'deletedAt', event.block.timestamp.toString())
    assert.fieldEquals('DebtAuction', auctionId, 'active', 'false')

    clearStore()
  })
})
