import {
    Bytes,
    ByteArray,
    ethereum
} from '@graphprotocol/graph-ts';

// https://ethereum.stackexchange.com/questions/114582/
export function decodeTuple(types: String, data: Bytes): ethereum.Value[] | null {

    const functionInput = data;

    //prepend a "tuple" prefix (function params are arrays, not tuples)
    const tuplePrefix = ByteArray.fromHexString(
        '0x0000000000000000000000000000000000000000000000000000000000000020'
    );

    const functionInputAsTuple = new Uint8Array(
        tuplePrefix.length + functionInput.length
    );

    //concat prefix & original input
    functionInputAsTuple.set(tuplePrefix, 0);
    functionInputAsTuple.set(functionInput, tuplePrefix.length);

    const tupleInputBytes = Bytes.fromUint8Array(functionInputAsTuple);
    const decoded = ethereum.decode(
        types,
        tupleInputBytes
    );
    if (decoded) {
        return decoded.toTuple()
    } else {
        return null
    }
}
