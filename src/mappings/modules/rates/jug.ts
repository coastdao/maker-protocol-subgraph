import { Bytes } from '@graphprotocol/graph-ts'
import { bytes, decimal, units } from '@protofire/subgraph-toolkit'

import { LogNote } from '../../../../generated/Jug/Jug'
import { CollateralType } from '../../../../generated/schema'

import { system as systemModule, protocolParameterChangeLogs as changeLogs } from '../../../entities'

// Start stability fee collection for a particular collateral type
export function handleInit(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let collateralType = CollateralType.load(ilk)

  if (collateralType) {
    collateralType.stabilityFee = decimal.ONE
    collateralType.stabilityFeeUpdatedAt = event.block.timestamp
    collateralType.save()
  }
}

// collect stability fees for a given collateral type
export function handleDrip(event: LogNote): void {
  let ilk = event.params.arg1.toString()
  let collateralType = CollateralType.load(ilk)

  if (collateralType) {
    collateralType.stabilityFeeUpdatedAt = event.block.timestamp

    collateralType.save()
  }
}

export function handleFile(event: LogNote): void {
  let signature = event.params.sig.toHexString()
  let system = systemModule.getSystemState(event)

  if (signature == '0x1a0b287e') {
    let ilk = event.params.arg1.toString()
    let what = event.params.arg2.toString()
    let data = bytes.toUnsignedInt(Bytes.fromUint8Array(event.params.data.subarray(68, 100)))

    if (what == 'duty') {
      let collateral = CollateralType.load(ilk)

      if (collateral) {
        collateral.stabilityFee = units.fromRay(data)
        collateral.save()

        changeLogs.createProtocolParameterChangeLog(event, "JUG", what, ilk,
          new changeLogs.ProtocolParameterValueBigDecimal(collateral.stabilityFee))
      }
    }
  } else if (signature == '0x29ae8114') {
    let what = event.params.arg1.toString()
    let data = bytes.toUnsignedInt(event.params.arg2)

    if (what == 'base') {
      system.baseStabilityFee = units.fromRay(data)
      system.save()
      changeLogs.createProtocolParameterChangeLog(event, "JUG", what, "",
        new changeLogs.ProtocolParameterValueBigDecimal(system.baseStabilityFee))

    }
  } else if (signature == '0xd4e8be83') {
    let what = event.params.arg1.toString()
    let data = bytes.toAddress(event.params.arg2) // vow: the address of the Vow contract

    if (what == 'vow') {
      system.jugVowContract = data
      system.save()
      changeLogs.createProtocolParameterChangeLog(event, "JUG", what, "",
        new changeLogs.ProtocolParameterValueBytes(system.jugVowContract))

    }
  }
}
