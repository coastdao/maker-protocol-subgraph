import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { clearStore, describe, test, assert, beforeEach, afterEach } from 'matchstick-as'
import { UpdateAddress as UpdateAddressEvent } from '../../../../../generated/ChainLog/ChainLog'
import { handleUpdateAddress } from '../../../../../src/mappings/modules/log/chainLog'
import { tests } from '../../../../../src/mappings/modules/tests'

function createEvent(key: Bytes, addr: Address): UpdateAddressEvent {
    return changetype<UpdateAddressEvent>(
        tests.helpers.events.getNewEvent([
            tests.helpers.params.getBytes('key', key),
            tests.helpers.params.getAddress('addr', addr),
        ]),
    )
}

describe('chainlog handle update address event', () => {
    test('logs address by key', () => {
        const keyString = "MCD_GOV"
        const key = Bytes.fromUTF8(keyString)
        const addrString = "0xa1A07333CAfDFCaF5767961B2e2ac1d108e0e7A3"
        const addr = Address.fromString(addrString)

        let event = createEvent(key, addr)

        handleUpdateAddress(event)

        assert.fieldEquals('ChainLog', keyString, 'address', addrString.toLowerCase())
    })
})
