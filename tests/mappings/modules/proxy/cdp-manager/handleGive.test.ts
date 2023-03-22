import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'
import { test, clearStore, assert } from 'matchstick-as'
import { LogNote } from '../../../../../generated/CdpManager/DssCdpManager'
import { Vault } from '../../../../../generated/schema'
import { collateralTypes, users } from '../../../../../src/entities'
import { handleGive } from '../../../../../src/mappings/modules/proxy/cdp-manager'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockIlks, mockUrns, mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(cdpId: string, dst: string): LogNote {
    let signature = '0x1a0b287e' // random bogus signature
    let sigParam = tests.helpers.params.getBytes('sig', Bytes.fromHexString(signature))
    let usrParam = tests.helpers.params.getAddress('usr', Address.fromString(dst))
    let arg1Bytes = Bytes.fromUint8Array(Bytes.fromBigInt(BigInt.fromString(cdpId)).reverse())
    let arg1Param = tests.helpers.params.getBytes('arg1', arg1Bytes)
    let arg2Bytes = Bytes.fromHexString(dst)
    let arg2Param = tests.helpers.params.getBytes('arg2', arg2Bytes)

    let dataBytes = Bytes.fromHexString(signature)
    dataBytes = dataBytes.concat(arg1Bytes).concat(new Bytes(32 - arg1Bytes.length))
    dataBytes = dataBytes.concat(arg2Bytes).concat(new Bytes(32 - arg2Bytes.length))
    let dataParam = tests.helpers.params.getBytes('data', dataBytes)

    let event = changetype<LogNote>(tests.helpers.events.getNewEvent([
        sigParam, usrParam, arg1Param, arg2Param, dataParam
    ]))
    return event
}

test('CdpManager#handleGive: Give the CDP ownership to a another address', () => {
    let collateralTypeId = 'c1'
    let u = '0x8195d3496305d2dbe43b21d51e6cc77b6c9c8364'
    let v = '0x9d96b0561be0440ebe93e79fe06a23bbe8270f90'

    let collateralType = collateralTypes.loadOrCreateCollateralType(collateralTypeId)
    collateralType.rate = BigDecimal.fromString('0.5')
    collateralType.debtNormalized = BigDecimal.fromString('100')
    collateralType.totalDebt = BigDecimal.fromString('50')
    collateralType.save()

    let user = users.getOrCreateUser(Address.fromString(u))
    user.vaultCount = integer.ONE;
    user.save()

    let vaultId = u.concat('-').concat(collateralTypeId)
    let vault = new Vault(vaultId)
    vault.owner = u
    vault.save()
    let cdpId = "1234"

    let event = createEvent(cdpId, v)

    mockIlks(cdpId, collateralTypeId)
    mockUrns(cdpId, u)

    handleGive(event)

    assert.fieldEquals('User', u, 'vaultCount', "0")
    assert.fieldEquals('User', v, 'vaultCount', "1")
    assert.fieldEquals('Vault', vaultId, 'collateral', '0')
    assert.fieldEquals('Vault', vaultId, 'debt', '0')

    clearStore()
})
