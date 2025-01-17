import { BigInt, Address } from '@graphprotocol/graph-ts'
import { test, assert, clearStore, describe } from 'matchstick-as'
import { tests } from '../../../../../src/mappings/modules/tests'
import { system as systemModule } from '../../../../../src/entities'
import { Kick } from '../../../../../generated/Flop/Flopper'
import { handleKick } from '../../../../../src/mappings/modules/system-stabilizer/flop'
import { mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

describe('Flopper#handleKick', () => {
  test('creates the entity Auction', () => {
    let id = BigInt.fromString('50')

    let auctionId = id
      .toString()
      .concat('-')
      .concat('debt')

    let lot = BigInt.fromString('10000000000000000000000000000000000000000000000000')
    let bid = BigInt.fromString('10')
    let gal = '0x4d95a049d5b0b7d32058cd3f2163015747522e99'
    let event = changetype<Kick>(
      tests.helpers.events.getNewEvent([
        tests.helpers.params.getBigInt('id', id),
        tests.helpers.params.getBigInt('lot', lot),
        tests.helpers.params.getBigInt('bid', bid),
        tests.helpers.params.getAddress('gal', Address.fromString(gal)),
      ]),
    )
    event.block.timestamp = BigInt.fromString('1500')

    let system = systemModule.getSystemState(event)
    system.debtAuctionBidDuration = BigInt.fromString('1000')
    system.save()
    handleKick(event)

    assert.fieldEquals('DebtAuction', auctionId, 'quantity', lot.toString())
    assert.fieldEquals('DebtAuction', auctionId, 'bidAmount', bid.toString())
    assert.fieldEquals('DebtAuction', auctionId, 'highestBidder', gal)
    assert.fieldEquals('DebtAuction', auctionId, 'endTimeAt', '2500')
    clearStore()
  })
})
