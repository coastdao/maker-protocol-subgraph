import { ethereum, Address } from '@graphprotocol/graph-ts'
import { decimal, integer, units } from '@protofire/subgraph-toolkit'

import { ChainLog, SystemState } from '../../generated/schema'
import { Vat } from '../../generated/Vat/Vat'
export namespace system {
  export function getSystemState(event: ethereum.Event): SystemState {
    const chainLog = ChainLog.load("MCD_VAT")
    // this is mainnet address of MCD_VAT
    let address: string = '0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b'
    if (chainLog) {
      address = chainLog.address.toHexString()
    }
    let vatContract = Vat.bind(Address.fromString(address))
    let state = SystemState.load('current')

    if (state == null) {
      state = new SystemState('current')

      state.totalDebt = decimal.ZERO
      state.totalSystemDebt = decimal.ZERO // Unbacked Dai

      // Entities counters
      state.collateralCount = integer.ZERO
      state.userProxyCount = integer.ZERO
      state.unmanagedVaultCount = integer.ZERO
      state.vaultCount = integer.ZERO

      // System parameters
      state.baseStabilityFee = decimal.ONE
      state.savingsRate = decimal.ONE
      state.totalDebtCeiling = decimal.ZERO

      // DAI Erc.20 parameters
      state.daiTotalSupply = decimal.ZERO

      // pot parameters
      state.dsrLiveUpdatedAt = event.block.timestamp
      state.dsrLive = true

      // dog parameters
      state.totalDaiAmountToCoverDebtAndFees = decimal.ZERO
    }

    // Hotfix for totalDebt
    let debt = vatContract.try_debt();
    state.totalDebt = debt.reverted ? state.totalDebt : units.fromRad(debt.value);
    // timestamp for daistats
    state.timestamp = event.block.timestamp
    return state as SystemState
  }
}
