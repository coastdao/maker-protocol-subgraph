import { BigDecimal, Bytes, Address, log } from '@graphprotocol/graph-ts'
import { bytes, units } from '@protofire/subgraph-toolkit'

import { LogNote, Pot } from '../../../../generated/Pot/Pot'

import { ChainLog, LiveChangeLog } from '../../../../generated/schema'
import { system as systemModule, users, protocolParameterChangeLogs as changeLogs } from '../../../entities'

export function handleFile(event: LogNote): void {
  let what = event.params.arg1.toString()

  let signature = event.params.sig.toHexString()

  if (signature == '0x29ae8114') {
    if (what == 'dsr') {
      let system = systemModule.getSystemState(event)
      let data = bytes.toUnsignedInt(event.params.arg2)

      system.savingsRate = units.fromRay(data) // Dai Savings Rate
      system.save()

      changeLogs.createProtocolParameterChangeLog(event, "POT", what, "",
        new changeLogs.ProtocolParameterValueBigDecimal(system.savingsRate))
    }
  } else if (signature == '0xd4e8be83') {
    if (what == 'vow') {
      let system = systemModule.getSystemState(event)
      let data = bytes.toAddress(event.params.arg2)
      system.potVowContract = data
      system.save()

      changeLogs.createProtocolParameterChangeLog(event, "POT", what, "",
        new changeLogs.ProtocolParameterValueBytes(system.potVowContract))
    }
  }
}

export function handleCage(event: LogNote): void {
  let system = systemModule.getSystemState(event)
  system.savingsRate = BigDecimal.fromString('1') // Dai Savings Rate

  let log = new LiveChangeLog(event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-0')
  log.contract = event.address
  log.block = event.block.number
  log.timestamp = event.block.timestamp
  log.transaction = event.transaction.hash

  system.save()
  log.save()
}

export function handleJoin(event: LogNote): void {
  let wad = units.fromWad(bytes.toSignedInt(Bytes.fromUint8Array(event.params.arg1)))

  let user = users.getOrCreateUser(event.transaction.from)
  user.savings = user.savings.plus(wad)
  user.save()

  let system = systemModule.getSystemState(event)
  system.totalSavingsInPot = system.totalSavingsInPot.plus(wad)
  system.save()
}

export function handleExit(event: LogNote): void {
  let wad = units.fromWad(bytes.toSignedInt(Bytes.fromUint8Array(event.params.arg1)))

  let user = users.getOrCreateUser(event.transaction.from)
  user.savings = user.savings.minus(wad)
  user.save()

  let system = systemModule.getSystemState(event)
  system.totalSavingsInPot = system.totalSavingsInPot.minus(wad)
  system.save()
}

export function handleDrip(event: LogNote): void {
  let system = systemModule.getSystemState(event)
  // this is mainnet address of MCD_POT
  const chainLogPot = ChainLog.load("MCD_POT")
  let address: string = '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7'
  if (chainLogPot) {
    address = chainLogPot.address.toHexString()
  }
  let potContract = Pot.bind(Address.fromString(address))

  let callResult = potContract.try_chi()
  if (callResult.reverted) {
    log.warning('handleDrip: try_chi reverted', [])
  }
  system.rateAccumulator = callResult.value
  system.lastPotDripAt = event.block.timestamp
  system.save()
}
