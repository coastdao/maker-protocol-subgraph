import { BigDecimal, Bytes } from '@graphprotocol/graph-ts'
import { bytes, integer, decimal, units } from '@protofire/subgraph-toolkit'

import { LogNote } from '../../../../generated/Vat/Vat'

import {
  CollateralType,
  Vault,
  VaultCollateralChangeLog,
  VaultDebtChangeLog,
  VaultSplitChangeLog,
  DaiMoveLog,
  CollateralChangeLog,
  User,
  SystemDebt,
  CollateralTransferLog,
  LiveChangeLog,
  CollateralPrice,
} from '../../../../generated/schema'

import { collaterals, collateralTypes, users, system as systemModule, vaults, systemDebts, protocolParameterChangeLogs as changeLogs } from '../../../entities'

// Register a new collateral type
export function handleInit(event: LogNote): void {
  let collateral = new CollateralType(event.params.arg1.toString())
  collateral.debtCeiling = decimal.ZERO
  collateral.vaultDebtFloor = decimal.ZERO
  collateral.totalCollateral = decimal.ZERO
  collateral.totalDebt = decimal.ZERO
  collateral.debtNormalized = decimal.ZERO

  collateral.liquidationLotSize = decimal.ZERO
  collateral.liquidationPenalty = decimal.ZERO
  collateral.liquidationRatio = decimal.ZERO

  collateral.rate = decimal.ONE

  collateral.stabilityFee = decimal.ONE

  collateral.unmanagedVaultCount = integer.ZERO
  collateral.vaultCount = integer.ZERO

  collateral.addedAt = event.block.timestamp
  collateral.addedAtBlock = event.block.number
  collateral.addedAtTransaction = event.transaction.hash

  collateral.save()

  // Update system state
  let state = systemModule.getSystemState(event)
  state.collateralCount = state.collateralCount.plus(integer.ONE)
  state.save()
}

// Modify collateral type parameters
export function handleFile(event: LogNote): void {
  let signature = event.params.sig.toHexString()
  let system = systemModule.getSystemState(event)

  if (signature == '0x29ae8114') {
    let what = event.params.arg1.toString()
    let data = bytes.toUnsignedInt(event.params.arg2)

    if (what == 'Line') {
      system.totalDebtCeiling = units.fromRad(data)
      changeLogs.createProtocolParameterChangeLog(event, "VAT", "Line", "",
        new changeLogs.ProtocolParameterValueBigDecimal(system.totalDebtCeiling))

    }
  } else if (signature == '0x1a0b287e') {
    let ilk = event.params.arg1.toString()
    let what = event.params.arg2.toString()
    let data = bytes.toUnsignedInt(event.params.arg3)

    let collateral = CollateralType.load(ilk)

    if (collateral != null) {
      if (what == 'spot') {
        // Spot price is stored on the current price object
        changeLogs.createProtocolParameterChangeLog(event, "VAT", what, ilk,
          new changeLogs.ProtocolParameterValueBigDecimal(units.fromRay(data)))

      } else if (what == 'line') {
        collateral.debtCeiling = units.fromRad(data)
        changeLogs.createProtocolParameterChangeLog(event, "VAT", what, ilk,
          new changeLogs.ProtocolParameterValueBigDecimal(collateral.debtCeiling))

      } else if (what == 'dust') {
        collateral.vaultDebtFloor = units.fromRad(data)
        changeLogs.createProtocolParameterChangeLog(event, "VAT", what, ilk,
          new changeLogs.ProtocolParameterValueBigDecimal(collateral.vaultDebtFloor))

      }

      collateral.updatedAt = event.block.timestamp
      collateral.updatedAtBlock = event.block.number
      collateral.updatedAtTransaction = event.transaction.hash

      collateral.save()
    }
  }

  system.save()
}

// Change Liveness of Vat Contract
export function handleCage(event: LogNote): void {
  let log = new LiveChangeLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-0')
  log.contract = event.address
  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

// Modify a user's collateral balance
export function handleSlip(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let usr = bytes.toAddress(event.params.arg2)
  let wad = units.fromWad(bytes.toSignedInt(Bytes.fromUint8Array(event.params.arg3)))

  let collateralType = CollateralType.load(ilk)
  if (collateralType == null) {
    return
  }
  let owner = users.getOrCreateUser(usr)
  let collateral = collaterals.loadOrCreateCollateral(event, ilk, owner.id)

  let amountBefore = collateral.amount
  collateral.amount = collateral.amount.plus(wad)
  collateral.updatedAt = event.block.timestamp
  collateral.updatedAtBlock = event.block.number
  collateral.updatedAtTransaction = event.transaction.hash
  collateral.save()

  let log = new CollateralChangeLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-0')
  log.block = event.block.number
  log.collateral = collateral.id
  log.collateralAfter = collateral.amount
  log.collateralBefore = amountBefore
  log.save()

  collateralType.totalCollateral.plus(wad)
  collateralType.updatedAt = event.block.timestamp
  collateralType.updatedAtBlock = event.block.number
  collateralType.updatedAtTransaction = event.transaction.hash
  collateralType.save()
}

// Transfer collateral between users
export function handleFlux(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let srcAddress = bytes.toAddress(event.params.arg2)
  let dstAddress = bytes.toAddress(event.params.arg3)
  let wad = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(100, 132)))

  let Δwad = units.fromWad(wad)

  let srcUser = users.getOrCreateUser(srcAddress)
  let dstUser = users.getOrCreateUser(dstAddress)

  let srcCollateral = collaterals.loadOrCreateCollateral(event, ilk, srcUser.id)
  srcCollateral.amount = srcCollateral.amount.minus(Δwad)
  srcCollateral.updatedAt = event.block.timestamp
  srcCollateral.updatedAtBlock = event.block.number
  srcCollateral.updatedAtTransaction = event.transaction.hash
  srcCollateral.save()

  let dstCollateral = collaterals.loadOrCreateCollateral(event, ilk, dstUser.id)
  dstCollateral.amount = dstCollateral.amount.plus(Δwad)
  dstCollateral.updatedAt = event.block.timestamp
  dstCollateral.updatedAtBlock = event.block.number
  dstCollateral.updatedAtTransaction = event.transaction.hash
  dstCollateral.save()

  let srcLog = new CollateralTransferLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-5.0')
  srcLog.src = srcAddress
  srcLog.dst = dstAddress
  srcLog.amount = Δwad
  srcLog.collateral = srcCollateral.id
  srcLog.direction = 'OUT'
  srcLog.block = event.block.number
  srcLog.timestamp = event.block.timestamp
  srcLog.transaction = event.transaction.hash
  srcLog.save()

  let dstLog = new CollateralTransferLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-5.1')
  dstLog.src = srcAddress
  dstLog.dst = dstAddress
  dstLog.amount = Δwad
  dstLog.collateral = dstCollateral.id
  dstLog.direction = 'IN'
  dstLog.block = event.block.number
  dstLog.timestamp = event.block.timestamp
  dstLog.transaction = event.transaction.hash
  dstLog.save()
}

// Transfer stablecoin between users
//dai[src] = sub(dai[src], rad);
export function handleMove(event: LogNote): void {
  let srcAddress = bytes.toAddress(event.params.arg1)
  let dstAddress = bytes.toAddress(event.params.arg2)
  let amount = units.fromRad(bytes.toUnsignedInt(event.params.arg3))

  let srcUser = users.getOrCreateUser(srcAddress)
  let dstUser = users.getOrCreateUser(dstAddress)
  srcUser.totalVaultDai = srcUser.totalVaultDai.minus(amount)
  dstUser.totalVaultDai = dstUser.totalVaultDai.plus(amount)
  srcUser.save()
  dstUser.save()

  let log = new DaiMoveLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-4')
  log.src = srcAddress
  log.dst = dstAddress
  log.amount = amount

  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  log.save()
}

// this function exists just because assembly script does not properly
// handle string | null type assigned as variable.
// see related issue: https://github.com/AssemblyScript/assemblyscript/issues/2455
const stringOrNullToString = (stringOrNull: string | null): string => {
  if (stringOrNull === null) {
    return ""
  } else {
    return stringOrNull
  }
}

// Create or modify a Vault
export function handleFrob(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let urn = bytes.toAddress(event.params.arg2)
  let v = bytes.toAddress(event.params.arg3)
  let w = bytes.toAddress(Bytes.fromUint8Array(event.params.data.subarray(100, 132)))
  let dink = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164)))
  let dart = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196)))

  let collateralType = CollateralType.load(ilk)
  if (collateralType != null) {
    let Δdebt = units.fromWad(dart)
    let Δcollateral = units.fromWad(dink)

    let vault = Vault.load(urn.toHexString() + '-' + collateralType.id)
    let vaultOldCollateralizationRatio = decimal.ZERO

    if (vault == null) {

      // Register new unmanaged vault
      vault = vaults.loadOrCreateVault(urn, collateralType, event, false)
      vault.collateral = vault.collateral.plus(Δcollateral)
      vault.debt = vault.debt.plus(Δdebt)

    } else {
      // temporarily remember old collateralization ratio
      let collateralTypePrice: string = stringOrNullToString(collateralType.price)
      if (collateralTypePrice !== "") {
        if (vault.debt.notEqual(decimal.ZERO) && collateralType.rate.notEqual(decimal.ZERO)) {
          const price = CollateralPrice.load(collateralTypePrice)
          if (price != null) {
            vaultOldCollateralizationRatio = vault.collateral.times(price.value).div(vault.debt.times(collateralType.rate))
          }
        }
      }

      // Update existing Vault
      vault.collateral = vault.collateral.plus(Δcollateral)

      // We are adding normalized debt values. Not sure whether multiplying by rate works here.
      vault.debt = vault.debt.plus(Δdebt)

      vault.updatedAt = event.block.timestamp
      vault.updatedAtBlock = event.block.number
      vault.updatedAtTransaction = event.transaction.hash

    }
    let previousCollateral = vault.collateral
    let previousDebt = vault.debt

    if (!Δcollateral.equals(decimal.ZERO)) {
      let vaultCollateralChangeLog = new VaultCollateralChangeLog(
        event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-1',
      )
      vaultCollateralChangeLog.vault = vault.id
      vaultCollateralChangeLog.collateralBefore = previousCollateral
      vaultCollateralChangeLog.collateralAfter = vault.collateral
      vaultCollateralChangeLog.collateralDiff = Δcollateral

      vaultCollateralChangeLog.block = event.block.number
      vaultCollateralChangeLog.timestamp = event.block.timestamp
      vaultCollateralChangeLog.transaction = event.transaction.hash
      vaultCollateralChangeLog.rate = collateralType.rate

      vaultCollateralChangeLog.save()
    }

    if (!Δdebt.equals(decimal.ZERO)) {
      let vaultDebtChangeLog = new VaultDebtChangeLog(
        event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-2',
      )
      vaultDebtChangeLog.vault = vault.id
      vaultDebtChangeLog.debtBefore = previousDebt
      vaultDebtChangeLog.debtAfter = vault.debt
      vaultDebtChangeLog.debtDiff = Δdebt

      vaultDebtChangeLog.block = event.block.number
      vaultDebtChangeLog.timestamp = event.block.timestamp
      vaultDebtChangeLog.transaction = event.transaction.hash
      vaultDebtChangeLog.rate = collateralType.rate

      vaultDebtChangeLog.save()
    }

    let collateralOwner = users.getOrCreateUser(v)
    let collateral = collaterals.loadOrCreateCollateral(event, ilk, collateralOwner.id)

    let amountBefore = collateral.amount
    collateral.amount = collateral.amount.minus(units.fromWad(dink))
    collateral.updatedAt = event.block.timestamp
    collateral.updatedAtBlock = event.block.number
    collateral.updatedAtTransaction = event.transaction.hash
    collateral.save()

    let collateralChangeLog = new CollateralChangeLog(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-0',
    )
    collateralChangeLog.block = event.block.number
    collateralChangeLog.collateral = collateral.id
    collateralChangeLog.collateralAfter = collateral.amount
    collateralChangeLog.collateralBefore = amountBefore
    collateralChangeLog.save()

    let srcDaiUser = users.getOrCreateUser(w)
    let dtab = collateralType.rate.times(units.fromWad(dart))

    srcDaiUser.totalVaultDai = srcDaiUser.totalVaultDai.plus(dtab)
    srcDaiUser.save()

    // Track total collateral
    collateralType.totalCollateral = collateralType.totalCollateral.plus(Δcollateral)

    // Debt normalized should coincide with Ilk.Art
    collateralType.debtNormalized = collateralType.debtNormalized.plus(Δdebt)

    // Total debt is Art * rate (like on DAIStats)
    collateralType.totalDebt = collateralType.debtNormalized.times(collateralType.rate)

    collateralType.updatedAt = event.block.timestamp
    collateralType.updatedAtBlock = event.block.number
    collateralType.updatedAtTransaction = event.transaction.hash

    // calculate new safetyLevel
    // if (liquidationRatio == oldRatio) then safetyLevel = safetyLevel + 1
    // else safetyLevel = safetyLevel + max(5, (newRatio - liquidationRatio)/(oldRatio - liquidationRatio))
    let ΔsafetyLevel = decimal.ZERO
    if (collateralType.liquidationRatio.equals(vaultOldCollateralizationRatio)) {
      // value cannot be calculated. it could be very close to liquidation,
      // or the vault user is very strict. could be decimal.ONE instead.
      ΔsafetyLevel = decimal.ZERO
    } else {
      // calculate new collateral ratio.
      let vaultNewCollateralizationRatio = decimal.ZERO
      let collateralTypePrice: string = stringOrNullToString(collateralType.price)
      if (collateralTypePrice !== "") {
        if (vault.debt.notEqual(decimal.ZERO) && collateralType.rate.notEqual(decimal.ZERO)) {
          const price = CollateralPrice.load(collateralTypePrice)
          if (price != null) {
            vaultNewCollateralizationRatio = vault.collateral.times(price.value).div(vault.debt.times(collateralType.rate))
          }
        }
      }
      if (vault.collateral.equals(decimal.ZERO) ||
        vault.debt.equals(decimal.ZERO) ||
        vaultOldCollateralizationRatio.equals(decimal.ZERO) ||
        vaultNewCollateralizationRatio.equals(decimal.ZERO)) {
        // if collateral or debt is zero, the vault is considered inactive and safety is undefined.
        // but there is still some action, so let it be one.
        ΔsafetyLevel = BigDecimal.fromString("1")
      } else if (collateralType.liquidationRatio.gt(vaultOldCollateralizationRatio) ||
        collateralType.liquidationRatio.gt(vaultNewCollateralizationRatio)) {
        // if any of collateralization ratio is less than liquidation ratio
        // then safety level is decreased
        ΔsafetyLevel = BigDecimal.fromString("-5")
      } else {
        // else, if ΔsafetyLevel can be calculated as ratio and max(..., 5),
        // then calculate it.
        ΔsafetyLevel = (vaultNewCollateralizationRatio.minus(collateralType.liquidationRatio))
          .div(vaultOldCollateralizationRatio.minus(collateralType.liquidationRatio))
        if (ΔsafetyLevel.gt(BigDecimal.fromString("5"))) {
          ΔsafetyLevel = BigDecimal.fromString("5")
        }
      }
    }
    vault.safetyLevel = vault.safetyLevel.plus(ΔsafetyLevel)

    vault.save()
    collateralType.save()
  }
}

// Split a Vault - binary approval or splitting/merging Vaults
export function handleFork(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let src = bytes.toAddress(event.params.arg2)
  let dst = bytes.toAddress(event.params.arg3)
  let dink = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(100, 132)))
  let dart = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164)))

  let vault1 = Vault.load(
    src
      .toHexString()
      .concat('-')
      .concat(ilk),
  )

  let collateralType = CollateralType.load(ilk)
  if (collateralType) {
    if (vault1) {
      vault1.collateral = vault1.collateral.minus(units.fromWad(dink))
      vault1.debt = vault1.debt.minus(units.fromWad(dart))
      vault1.save()
    }

    let vault2 = vaults.loadOrCreateVault(dst, collateralType, event, false)
    vault2.collateral = vault2.collateral.plus(units.fromWad(dink))
    vault2.debt = vault2.debt.plus(units.fromWad(dart))
    vault2.save()

    let log = new VaultSplitChangeLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-3')
    log.src = src
    log.dst = dst
    if (vault1) {
      log.vault = vault1.id
    } else if (vault2) {
      log.vault = vault2.id
    }
    log.collateralToMove = units.fromWad(dink)
    log.debtToMove = units.fromWad(dart)
    log.block = event.block.number
    log.timestamp = event.block.timestamp
    log.transaction = event.transaction.hash
    log.rate = collateralType.rate
    log.save()
  }
}

// Liquidate a Vault
export function handleGrab(event: LogNote): void {
  let ilkIndex = event.params.arg1.toString()
  let urnAddress = bytes.toAddress(event.params.arg2)
  let liquidatorAddress = bytes.toAddress(event.params.arg3) //  dog's milk.clip
  let vowAddress = bytes.toAddress(Bytes.fromUint8Array(event.params.data.subarray(100, 132)))

  let dink = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(132, 164))) // dink: amount of collateral to exchange.
  let collateralAmount = units.fromWad(dink)
  let dart = bytes.toSignedInt(Bytes.fromUint8Array(event.params.data.subarray(164, 196)))
  let debtAmount = units.fromWad(dart)

  let liquidator = users.getOrCreateUser(liquidatorAddress)
  liquidator.save()

  let collateralType = collateralTypes.loadOrCreateCollateralType(ilkIndex.toString())
  collateralType.debtNormalized = collateralType.debtNormalized.plus(debtAmount)

  let totalDebt = debtAmount.times(collateralType.rate)

  collateralType.totalDebt = totalDebt
  collateralType.save()

  let vault = vaults.loadOrCreateVault(urnAddress, collateralType, event, false)
  vault.collateral = vault.collateral.plus(collateralAmount) // dink its a negative number
  vault.debt = vault.debt.plus(debtAmount) // dart its a negative number
  vault.save()

  let collateral = collaterals.loadOrCreateCollateral(event, collateralType.id, liquidator.id)
  collateral.amount = collateral.amount.minus(collateralAmount) // adds since dink is negative
  collateral.save()

  let sin = systemDebts.loadOrCreateSystemDebt(vowAddress.toHexString())
  sin.amount = sin.amount.minus(totalDebt) // adds since totalDebt is negative
  sin.save()

  let systemState = systemModule.getSystemState(event)
  systemState.totalSystemDebt = systemState.totalSystemDebt.minus(totalDebt) // adds since totalDebt is negative
  systemState.save()

  // FIXME Indexing : emit Bark(ilk, urn, dink, dart, due, milk.clip, id) will make this handler unnecesary
}

// Create/destroy equal quantities of stablecoin and system debt
export function handleHeal(event: LogNote): void {
  let rad = units.fromRad(bytes.toUnsignedInt(event.params.arg1))

  let user = User.load(event.address.toHexString())

  if (user) {
    user.totalVaultDai = user.totalVaultDai.minus(rad)
    user.save()

    let systemDebt = SystemDebt.load(event.address.toHexString())

    if (!systemDebt) {
      systemDebt = new SystemDebt(event.address.toHexString())
    }
    systemDebt.owner = user.id
    systemDebt.amount = systemDebt.amount.minus(rad)
    systemDebt.save()
  }

  let system = systemModule.getSystemState(event)
  system.totalDebt = system.totalDebt.minus(rad)
  system.totalSystemDebt = system.totalSystemDebt.minus(rad)
  system.save()
}

// Mint unbacked stablecoin
export function handleSuck(event: LogNote): void {
  let userAddress1 = bytes.toAddress(event.params.arg1)
  let userAddress2 = bytes.toAddress(event.params.arg2)
  let rad = units.fromRad(bytes.toUnsignedInt(event.params.arg3))

  let user1 = User.load(userAddress1.toHexString())
  let user2 = User.load(userAddress2.toHexString())

  if (user1) {
    let systemDebt = SystemDebt.load(userAddress1.toHexString())

    if (!systemDebt) {
      systemDebt = new SystemDebt(userAddress1.toHexString())
    }

    systemDebt.owner = user1.id
    systemDebt.amount = rad
    systemDebt.save()
  }

  if (user2) {
    user2.totalVaultDai = user2.totalVaultDai.plus(rad)
    user2.save()
  }

  let system = systemModule.getSystemState(event)
  system.totalDebt = system.totalDebt.plus(rad)
  system.totalSystemDebt = system.totalSystemDebt.plus(rad)
  system.save()
}

// Modify the debt multiplier, creating/destroying corresponding debt
export function handleFold(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let userAddress = bytes.toAddress(event.params.arg2)
  let rate = units.fromRad(bytes.toSignedInt(event.params.arg3))

  let collateral = CollateralType.load(ilk)
  let user = users.getOrCreateUser(userAddress)

  if (collateral && user) {
    let rad = collateral.totalDebt.times(rate)

    collateral.rate = collateral.rate.plus(rate)
    collateral.save()

    user.totalVaultDai = user.totalVaultDai.plus(rad)
    user.save()

    let system = systemModule.getSystemState(event)
    system.totalDebt = system.totalDebt.plus(rad)
    system.save()
  }
}
