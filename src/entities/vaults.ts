import { Address, ethereum } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'
import { CollateralType, Vault, VaultCreationLog } from '../../generated/schema'
import { users, system as systemModule } from '.'

export namespace vaults {
  export function getVaultId(urn: string, ilk: string): string {
    // Urn storage urn = urns[i][u];
    return `${urn}-${ilk}`
  }
  /**
   * @param urn
   * @param collateralType
   * @param event
   * @param managed if the vault is managed by cdp or not
   * @returns 
   */
  export function loadOrCreateVault(urn: Address, collateralType: CollateralType, event: ethereum.Event, managed: boolean): Vault {
    let id = getVaultId(urn.toHexString(), collateralType.id)
    let entity = Vault.load(id)
    if (entity == null) {

      // Update vault counter for collateral and system
      let system = systemModule.getSystemState(event)
      if (managed) {
        system.vaultCount = system.vaultCount.plus(integer.ONE)
        collateralType.vaultCount = collateralType.vaultCount.plus(integer.ONE)
      } else {
        system.unmanagedVaultCount = system.unmanagedVaultCount.plus(integer.ONE)
        collateralType.unmanagedVaultCount = collateralType.unmanagedVaultCount.plus(integer.ONE)
      }
      system.save()
      collateralType.save()

      let owner = users.getOrCreateUser(urn)
      owner.vaultCount = owner.vaultCount.plus(integer.ONE)
      owner.save()

      entity = new Vault(id)
      entity.collateralType = collateralType.id
      entity.collateral = decimal.ZERO
      entity.debt = decimal.ZERO
      entity.handler = urn
      entity.owner = owner.id
      entity.safetyLevel = decimal.ZERO

      entity.openedAt = event.block.timestamp
      entity.openedAtBlock = event.block.number
      entity.openedAtTransaction = event.transaction.hash

      // Log vault creation
      let vaultCreationLog = new VaultCreationLog(
        event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-0',
      )
      vaultCreationLog.vault = entity.id
      vaultCreationLog.block = event.block.number
      vaultCreationLog.timestamp = event.block.timestamp
      vaultCreationLog.transaction = event.transaction.hash
      vaultCreationLog.rate = collateralType.rate
      vaultCreationLog.save()

      entity.save()
    }
    return entity as Vault
  }
}
