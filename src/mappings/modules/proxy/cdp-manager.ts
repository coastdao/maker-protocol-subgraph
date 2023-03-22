import { Address } from '@graphprotocol/graph-ts'
import { bytes, integer } from '@protofire/subgraph-toolkit'

import { DssCdpManager, NewCdp, LogNote } from '../../../../generated/CdpManager/DssCdpManager'
import { CollateralType, Vault, VaultTransferChangeLog } from '../../../../generated/schema'

import { users, vaults } from '../../../entities'

// Open a new CDP for a given user
export function handleOpen(event: NewCdp): void {
  let manager = DssCdpManager.bind(event.address)
  let ilk = manager.ilks(event.params.cdp)
  let urn = manager.urns(event.params.cdp)

  let collateral = CollateralType.load(ilk.toString())

  if (collateral != null) {

    // Register new vault
    let vault = vaults.loadOrCreateVault(urn, collateral, event, true)
    vault.cdpId = event.params.cdp
    vault.save()
  }
}

// Give the CDP ownership to a another address
export function handleGive(event: LogNote): void {
  let cdp = bytes.toUnsignedInt(event.params.arg1)
  let dst = bytes.toAddress(event.params.arg2)

  let manager = DssCdpManager.bind(event.address)
  let ilk = manager.ilks(cdp)
  let urn = manager.urns(cdp)

  let vault = Vault.load(urn.toHexString() + '-' + ilk.toString())
  let collateralType = CollateralType.load(ilk.toString())

  if (collateralType != null && vault != null) {
    let previousOwner = users.getOrCreateUser(Address.fromString(vault.owner))
    let nextOwner = users.getOrCreateUser(dst)

    // Transfer ownership
    vault.owner = nextOwner.id
    vault.save()

    previousOwner.vaultCount = previousOwner.vaultCount.minus(integer.ONE)
    previousOwner.save()

    nextOwner.vaultCount = nextOwner.vaultCount.plus(integer.ONE)
    nextOwner.save()

    // Log vault transfer
    let log = new VaultTransferChangeLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-3')
    log.vault = vault.id
    log.previousOwner = previousOwner.id
    log.nextOwner = nextOwner.id

    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.rate = collateralType.rate

    log.save()
  }
}
