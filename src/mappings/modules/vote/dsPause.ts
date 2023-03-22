import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
import { system as systemModule } from '../../../entities'
import { LogNote } from '../../../../generated/DSPause/DSPause'
import { decodeTuple } from '../../../utils'
import { VoteLogDrop, VoteLogExec, VoteLogPlot, VoteLogSetDelay } from '../../../../generated/schema'

export function handleSetDelay(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // setDelay(uint delay_)
    if (signature == '0xe177246e') {
        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        let voteLog = new VoteLogSetDelay(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash
        voteLog.hat = systemState.hat
        voteLog.sender = event.transaction.from.toHexString()
        const delay_ = ethereum.decode("uint256", event.params.foo)
        if (delay_) {
            voteLog.delay_ = delay_.toBigInt()
            voteLog.save()
        }
    }
}

export function handlePlot(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // plot(address usr, bytes32 tag, bytes memory fax, uint eta)
    if (signature == '0x46d2fbbb') {
        const decodedParams = decodeTuple("(address,bytes32,bytes,uint256)", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        if (decodedParams) {
            let systemState = systemModule.getSystemState(event)
            const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
            let voteLog = new VoteLogPlot(id)
            voteLog.block = event.block.number
            voteLog.timestamp = event.block.timestamp
            voteLog.transaction = event.transaction.hash
            voteLog.hat = systemState.hat
            voteLog.sender = event.transaction.from.toHexString()
            voteLog.usr = decodedParams[0].toAddress()
            voteLog.tag = decodedParams[1].toBytes()
            voteLog.fax = decodedParams[2].toBytes()
            voteLog.eta = decodedParams[3].toBigInt()
            voteLog.save()
        }
    }
}


export function handleDrop(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // drop(address usr, bytes32 tag, bytes memory fax, uint eta)
    if (signature == '0x162c7de3') {
        const decodedParams = decodeTuple("(address,bytes32,bytes,uint256)", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        if (decodedParams) {
            let systemState = systemModule.getSystemState(event)
            const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()

            let voteLog = new VoteLogDrop(id)
            voteLog.block = event.block.number
            voteLog.timestamp = event.block.timestamp
            voteLog.transaction = event.transaction.hash
            voteLog.hat = systemState.hat
            voteLog.sender = event.transaction.from.toHexString()
            voteLog.usr = decodedParams[0].toAddress()
            voteLog.tag = decodedParams[1].toBytes()
            voteLog.fax = decodedParams[2].toBytes()
            voteLog.eta = decodedParams[3].toBigInt()

            voteLog.save()
        }
    }
}

export function handleExec(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // exec(address usr, bytes32 tag, bytes memory fax, uint eta)
    if (signature == '0x168ccd67') {
        const decodedParams = decodeTuple("(address,bytes32,bytes,uint256)", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        if (decodedParams) {
            let systemState = systemModule.getSystemState(event)
            const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()

            let voteLog = new VoteLogExec(id)
            voteLog.block = event.block.number
            voteLog.timestamp = event.block.timestamp
            voteLog.transaction = event.transaction.hash
            voteLog.hat = systemState.hat
            voteLog.sender = event.transaction.from.toHexString()
            voteLog.usr = decodedParams[0].toAddress()
            voteLog.tag = decodedParams[1].toBytes()
            voteLog.fax = decodedParams[2].toBytes()
            voteLog.eta = decodedParams[3].toBigInt()

            voteLog.save()
        }
    }
}
