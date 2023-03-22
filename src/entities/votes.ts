import { Address, Bytes } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'
import { Vault, VoteApproval, VoteSlate } from '../../generated/schema'

export namespace votes {
    export function loadOrCreateVoteSlate(id: string): VoteSlate {
        let entity = VoteSlate.load(id)
        if (entity == null) {
            entity = new VoteSlate(id)
            entity.addresses = []
            entity.slate = Bytes.fromHexString(id)
        }
        return entity as VoteSlate
    }
    export function loadOrCreateVoteApproval(id: string): VoteApproval {
        let entity = VoteApproval.load(id)
        if (entity == null) {
            entity = new VoteApproval(id)
            entity.approvals = integer.ZERO
            entity.address = Bytes.fromHexString(id)
        }
        return entity as VoteApproval
    }
}
