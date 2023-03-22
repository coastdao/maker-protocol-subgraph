import { tests } from '../../src/mappings/modules/tests'
import { Address, ethereum, BigInt, Bytes } from '@graphprotocol/graph-ts'

export function mockSin(era: i32): void {
  let arg1 = ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(era))
  let sinResult = BigInt.fromString('100').toI32()
  tests.helpers.contractCalls.mockFunction(
    Address.fromString('0xA950524441892A31ebddF91d3cEEFa04Bf454466'),
    'sin',
    'sin(uint256):(uint256)',
    [arg1],
    [ethereum.Value.fromI32(sinResult)],
  )
}

export function mockChi(): void {
  let chiResult = BigInt.fromString('10').toI32()
  tests.helpers.contractCalls.mockFunction(
    Address.fromString('0x197e90f9fad81970ba7976f33cbd77088e5d7cf7'),
    'chi',
    'chi():(uint256)',
    [],
    [ethereum.Value.fromI32(chiResult)],
  )
}

export function mockDebt(debtValue: string): void {
  let debtResult = BigInt.fromString(debtValue)
  tests.helpers.contractCalls.mockFunction(
    Address.fromString('0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b'),
    'debt',
    'debt():(uint256)',
    [],
    [ethereum.Value.fromUnsignedBigInt(debtResult)],
  )
}

export function mockIlks(cdpId: string, ilk: string): void {
  let ilksResult = Bytes.fromUTF8(ilk)
  tests.helpers.contractCalls.mockFunction(
    Address.fromString('0xa16081f360e3847006db660bae1c6d1b2e17ec2a'),
    'ilks',
    'ilks(uint256):(bytes32)',
    [ethereum.Value.fromUnsignedBigInt(BigInt.fromString(cdpId))],
    [ethereum.Value.fromBytes(ilksResult)],
  )
}

export function mockUrns(cdpId: string, address: string): void {
  let urnsResult = Address.fromString(address)
  tests.helpers.contractCalls.mockFunction(
    Address.fromString('0xa16081f360e3847006db660bae1c6d1b2e17ec2a'),
    'urns',
    'urns(uint256):(address)',
    [ethereum.Value.fromUnsignedBigInt(BigInt.fromString(cdpId))],
    [ethereum.Value.fromAddress(urnsResult)],
  )
}

export function mockCommon(): void {
  mockDebt("123456789")
}
