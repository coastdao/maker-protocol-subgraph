import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { test, clearStore, assert } from 'matchstick-as'
import { NewCdp } from '../../../../../generated/CdpManager/DssCdpManager'
import { collateralTypes } from '../../../../../src/entities'
import { handleOpen } from '../../../../../src/mappings/modules/proxy/cdp-manager'
import { tests } from '../../../../../src/mappings/modules/tests'
import { mockIlks, mockUrns, mockCommon } from '../../../../helpers/mockedFunctions'
mockCommon()

function createEvent(cdpId: string, usr: string, own: string): NewCdp {
    let usrParam = tests.helpers.params.getAddress('usr', Address.fromString(usr))
    let ownParam = tests.helpers.params.getAddress('own', Address.fromString(own))
    let cdpParam = tests.helpers.params.getBigInt('cdp', BigInt.fromString(cdpId))
    let event = changetype<NewCdp>(tests.helpers.events.getNewEvent([usrParam, ownParam, cdpParam]))
    return event
}

test('CdpManager#handleOpen: Register new vault', () => {
    let collateralTypeId = 'c1'
    let u = '0x8195d3496305d2dbe43b21d51e6cc77b6c9c8364'
    let v = '0x9d96b0561be0440ebe93e79fe06a23bbe8270f90'

    let collateralType = collateralTypes.loadOrCreateCollateralType(collateralTypeId)
    collateralType.rate = BigDecimal.fromString('0.5')
    collateralType.debtNormalized = BigDecimal.fromString('100')
    collateralType.totalDebt = BigDecimal.fromString('50')
    collateralType.save()

    let vaultId = u.concat('-').concat(collateralTypeId)
    let cdpId = "1234"

    let event = createEvent(cdpId, u, v)

    mockIlks(cdpId, collateralTypeId)
    mockUrns(cdpId, u)

    handleOpen(event)

    assert.fieldEquals('CollateralType', collateralTypeId, 'vaultCount', '1')
    assert.fieldEquals('CollateralType', collateralTypeId, 'unmanagedVaultCount', '0')
    assert.fieldEquals('SystemState', 'current', 'vaultCount', '1')
    assert.fieldEquals('SystemState', 'current', 'unmanagedVaultCount', '0')
    assert.fieldEquals('User', u, 'vaultCount', "1")

    assert.fieldEquals('Vault', vaultId, 'collateral', '0')
    assert.fieldEquals('Vault', vaultId, 'debt', '0')

    clearStore()
})
