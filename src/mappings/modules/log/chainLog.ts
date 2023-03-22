import { ChainLog } from '../../../../generated/schema'
import {
    UpdateAddress,
} from '../../../../generated/ChainLog/ChainLog'

export function handleUpdateAddress(event: UpdateAddress): void {
    const key = event.params.key.toString()
    let chainLog = ChainLog.load(key)
    if (chainLog == null) {
        chainLog = new ChainLog(key)
    }
    chainLog.address = event.params.addr
    chainLog.save()
}