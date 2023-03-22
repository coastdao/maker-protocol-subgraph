import { ProtocolParameterChangeLogBigInt, ProtocolParameterChangeLogBytes, ProtocolParameterChangeLogBigDecimal } from '../../generated/schema'
import { BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'

export namespace protocolParameterChangeLogs {
    // https://blog.covelline.com/entry/2022/09/15/094831
    export interface ProtocolParameterValueType { }
    export class ProtocolParameterValueBigInt implements ProtocolParameterValueType {
        constructor(readonly payload: BigInt) { }
    }
    export class ProtocolParameterValueBigDecimal implements ProtocolParameterValueType {
        constructor(readonly payload: BigDecimal) { }
    }
    export class ProtocolParameterValueBytes implements ProtocolParameterValueType {
        constructor(readonly payload: Bytes) { }
    }

    export function createProtocolParameterChangeLog(event: ethereum.Event, contractType: string, parameterKey1: string, parameterKey2: string, parameterValue: ProtocolParameterValueType): void {
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        if (parameterValue instanceof ProtocolParameterValueBigInt) {
            let protocolParameterChangeLog = new ProtocolParameterChangeLogBigInt(id)
            protocolParameterChangeLog.block = event.block.number
            protocolParameterChangeLog.timestamp = event.block.timestamp
            protocolParameterChangeLog.transaction = event.transaction.hash
            protocolParameterChangeLog.contractType = contractType
            protocolParameterChangeLog.parameterKey1 = parameterKey1
            protocolParameterChangeLog.parameterKey2 = parameterKey2
            protocolParameterChangeLog.parameterValue = (<ProtocolParameterValueBigInt>parameterValue).payload
            protocolParameterChangeLog.save()
        } else if (parameterValue instanceof ProtocolParameterValueBytes) {
            let protocolParameterChangeLog = new ProtocolParameterChangeLogBytes(id)
            protocolParameterChangeLog.block = event.block.number
            protocolParameterChangeLog.timestamp = event.block.timestamp
            protocolParameterChangeLog.transaction = event.transaction.hash
            protocolParameterChangeLog.contractType = contractType
            protocolParameterChangeLog.parameterKey1 = parameterKey1
            protocolParameterChangeLog.parameterKey2 = parameterKey2
            protocolParameterChangeLog.parameterValue = (<ProtocolParameterValueBytes>parameterValue).payload
            protocolParameterChangeLog.save()
        } else if (parameterValue instanceof ProtocolParameterValueBigDecimal) {
            let protocolParameterChangeLog = new ProtocolParameterChangeLogBigDecimal(id)
            protocolParameterChangeLog.block = event.block.number
            protocolParameterChangeLog.timestamp = event.block.timestamp
            protocolParameterChangeLog.transaction = event.transaction.hash
            protocolParameterChangeLog.contractType = contractType
            protocolParameterChangeLog.parameterKey1 = parameterKey1
            protocolParameterChangeLog.parameterKey2 = parameterKey2
            protocolParameterChangeLog.parameterValue = (<ProtocolParameterValueBigDecimal>parameterValue).payload
            protocolParameterChangeLog.save()
        }
    }
}
