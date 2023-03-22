import { BigDecimal } from '@graphprotocol/graph-ts'
import { units } from '@protofire/subgraph-toolkit'
import { File as FileEvent } from '../../../../generated/StairstepExponentialDecrease/StairstepExponentialDecrease'
import { system as systemModule, protocolParameterChangeLogs as changeLogs } from '../../../entities'

export function handleFile(event: FileEvent): void {
  let what = event.params.what.toString()

  let system = systemModule.getSystemState(event)
  if (what == 'cut') {
    system.secondsBetweenPriceDrops = event.params.data
    system.save()
    changeLogs.createProtocolParameterChangeLog(event, "ABACUS", "cut", "",
      new changeLogs.ProtocolParameterValueBigInt(system.secondsBetweenPriceDrops))
  }

  if (what == 'step') {
    system.multiplicatorFactorPerStep = units.fromRay(event.params.data)
    system.save()

    changeLogs.createProtocolParameterChangeLog(event, "ABACUS", "step", "",
      new changeLogs.ProtocolParameterValueBigDecimal(system.multiplicatorFactorPerStep))
  }
}
