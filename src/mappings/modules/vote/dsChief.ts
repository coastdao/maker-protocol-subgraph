import { Address, BigInt, Bytes, ethereum, crypto, ByteArray, log } from '@graphprotocol/graph-ts'
import { users, system as systemModule, votes } from '../../../entities'
import { Etch, LogNote } from '../../../../generated/DSChief/DSChief'
import { VoteApproval, VoteLogEtch, VoteLogFree, VoteLogLaunch, VoteLogLift, VoteLogLock, VoteLogVote, VoteSlate } from '../../../../generated/schema'

export function handleLaunch(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // launch()
    if (signature == '0x01339c21') {
        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        let voteLog = new VoteLogLaunch(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash
        voteLog.sender = event.transaction.from.toHexString()
        voteLog.hat = systemState.hat
        voteLog.save()
    }
}

export function handleLock(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // lock(uint wad)
    if (signature == '0xdd467064') {
        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()

        let voteLog = new VoteLogLock(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash
        voteLog.hat = systemState.hat
        voteLog.sender = event.transaction.from.toHexString()
        const wad = ethereum.decode("uint256", event.params.foo)
        if (wad) {
            voteLog.wad = wad.toBigInt()
            voteLog.save()
            const user = users.getOrCreateUser(event.transaction.from)
            user.voteWeight = user.voteWeight.plus(wad.toBigInt())
            if (user.voteSlate) {
                const voteSlate = votes.loadOrCreateVoteSlate(user.voteSlate)
                for (let i = 0; i < voteSlate.addresses.length; i++) {
                    const address = voteSlate.addresses[i]
                    const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
                    voteApproval.approvals = voteApproval.approvals.plus(wad.toBigInt())
                    voteApproval.save()
                }
            }
            user.save()
        }
    }
}

export function handleFree(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // free(uint wad)
    if (signature == '0xd8ccd0f3') {
        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()

        let voteLog = new VoteLogFree(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash

        if (systemState.hat != null) {
            voteLog.hat = systemState.hat
        }
        voteLog.sender = event.transaction.from.toHexString()
        const wad = ethereum.decode("uint256", event.params.foo)
        if (wad) {
            voteLog.wad = wad.toBigInt()
            voteLog.save()

            const user = users.getOrCreateUser(event.transaction.from)
            user.voteWeight = user.voteWeight.minus(wad.toBigInt())
            if (user.voteSlate) {
                const voteSlate = votes.loadOrCreateVoteSlate(user.voteSlate)
                for (let i = 0; i < voteSlate.addresses.length; i++) {
                    const address = voteSlate.addresses[i]
                    const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
                    voteApproval.approvals = voteApproval.approvals.minus(wad.toBigInt())
                    voteApproval.save()
                }
                voteSlate.save()
            }
            user.save()
        }
    }
}

/**
 * This function is separated from handleEtch becaue subgraph framework does not allow to return value in handler function.
 * This function could be called from `etch(address[] memory yays)` or `function vote(address[] memory yays)`.
 * @param event 
 * @returns return slate Bytes
 */
function handleEtchInternal(event: LogNote): Bytes {
    let signature = event.params.sig.toHexString()
    const oldId = event.transaction.hash.toHex() + '-' + (event.logIndex.minus(BigInt.fromI32(1))).toString() + "-etch"
    let oldVoteLog = VoteLogEtch.load(oldId)
    // it's ok to run if directly called from `etch(address[] memory yays)`
    if (oldVoteLog == null || signature == '0x5123e1fa') {
        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-etch"
        let voteLog = new VoteLogEtch(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash
        voteLog.sender = event.transaction.from.toHexString()
        voteLog.hat = systemState.hat

        const decodedYaysBytes = ethereum.decode("bytes32[]", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        const decodedYaysAddress = ethereum.decode("address[]", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        if (decodedYaysBytes && decodedYaysAddress) {
            const yaysAddress: Bytes[] = decodedYaysAddress.toAddressArray().map<Bytes>((address) => Bytes.fromHexString(address.toHexString()))
            voteLog.yays = yaysAddress
            voteLog.save()

            const packedYays: Bytes = decodedYaysBytes.toBytesArray().reduce<Bytes>((previous, current) => previous.concat(current), new Bytes(0))
            const slate = crypto.keccak256(
                ByteArray.fromHexString(packedYays.toHexString())
            )

            const voteSlate = votes.loadOrCreateVoteSlate(slate.toHexString())
            voteSlate.slate = Bytes.fromByteArray(slate)
            voteSlate.addresses = yaysAddress
            voteSlate.save()

            return Bytes.fromByteArray(slate)
        } else {
            // decode failure, should not be here
            return new Bytes(0)
        }
        // }
    } else {
        // old log already exists, do nothing
        return new Bytes(0)
    }
}

export function handleEtch(event: LogNote): void {
    handleEtchInternal(event)
}

/**
 * This function could be called from `vote(bytes32 slate)` and `function vote(address[] memory yays)`.
 * If it's directly called from `vote(bytes32 slate)`, it's ok to run the whole code.
 * However, if it's indirectly called from `function vote(address[] memory yays)`, the same methods are called twice.
 * In that case, you have to check if old log does not exist yet.
 * @param event 
 * @param slateArg 
 */
function handleVoteWithSlate(event: LogNote, slateArg: Bytes): void {

    const oldId = event.transaction.hash.toHex() + '-' + (event.logIndex.minus(BigInt.fromI32(1))).toString() + "-vote"
    let oldVoteLog = VoteLogVote.load(oldId)
    let signature = event.params.sig.toHexString()

    // in case of `vote(bytes32 slate)`, this function will run
    if (oldVoteLog == null || signature == '0xa69beaba') {

        let systemState = systemModule.getSystemState(event)
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString() + "-vote"
        let voteLog = new VoteLogVote(id)
        voteLog.block = event.block.number
        voteLog.timestamp = event.block.timestamp
        voteLog.transaction = event.transaction.hash
        voteLog.hat = systemState.hat
        voteLog.sender = event.transaction.from.toHexString()

        // in case of `vote(bytes32 slate)`, `event.params.fax.subarray(4)` contains slate value
        const slateEthValue = ethereum.decode("bytes32", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        const user = users.getOrCreateUser(event.transaction.from)
        // bytes shold contain some value
        let slate: Bytes = slateArg.length > 0 ? slateArg : (slateEthValue ? slateEthValue.toBytes() : new Bytes(0))
        voteLog.oldSlate = user.voteSlate
        voteLog.newSlate = slate.toHexString()
        voteLog.save()

        // slate length should not be zero. it should receive byte32 from args or `event.params.fax`
        if (slate.length != 0) {

            // move user vote weight from old slate to new slate
            if (user.voteWeight.gt(BigInt.fromString("0"))) {
                const oldVoteSlate = votes.loadOrCreateVoteSlate(user.voteSlate)
                for (let i = 0; i < oldVoteSlate.addresses.length; i++) {
                    const address = oldVoteSlate.addresses[i]
                    const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
                    voteApproval.approvals = voteApproval.approvals.minus(user.voteWeight)
                    voteApproval.save()
                }
                user.voteSlate = slate.toHexString()
                const newVoteSlate = votes.loadOrCreateVoteSlate(user.voteSlate)
                for (let i = 0; i < newVoteSlate.addresses.length; i++) {
                    const address = newVoteSlate.addresses[i]
                    const voteApproval = votes.loadOrCreateVoteApproval(address.toHexString())
                    voteApproval.approvals = voteApproval.approvals.plus(user.voteWeight)
                    voteApproval.save()
                }
                user.save()
            }
        }
    }
}

export function handleVote(event: LogNote): void {
    handleVoteWithSlate(event, new Bytes(0))
}

export function handleEtchAndVote(event: LogNote): void {
    const slate: Bytes = handleEtchInternal(event)
    handleVoteWithSlate(event, slate)
}

export function handleLift(event: LogNote): void {
    let signature = event.params.sig.toHexString()
    // lift(address whom)
    if (signature == '0x3c278bd5') {
        const id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
        const decodedAddress = ethereum.decode("address", Bytes.fromUint8Array(event.params.fax.subarray(4)))
        if (decodedAddress) {
            const whom = decodedAddress.toAddress()
            // set hat
            let systemState = systemModule.getSystemState(event)
            const voteApproval = votes.loadOrCreateVoteApproval(whom.toHexString())
            voteApproval.save()
            const newHat = whom.toHexString()
            const oldHat = systemState.hat
            systemState.hat = newHat
            systemState.save()

            let voteLog = new VoteLogLift(id)
            voteLog.block = event.block.number
            voteLog.timestamp = event.block.timestamp
            voteLog.transaction = event.transaction.hash

            voteLog.hat = newHat
            voteLog.oldHat = oldHat
            voteLog.sender = event.transaction.from.toHexString()
            voteLog.save()
        }
    }
}
