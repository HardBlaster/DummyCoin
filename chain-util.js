const EC = require('elliptic').ec;
const { v1: uuidV1 } = require('uuid');
const SHA256 = require('crypto-js/sha256');
const ec = new EC('secp256k1');

class ChainUtil {

    static getMerkleRoot(transactions) {
        return transactions.length === 1 ?
            transactions[0] :
            ChainUtil.getMerkleRoot(ChainUtil.toPair(transactions).reduce((tree, pair) =>
                [ ...tree, ChainUtil.hashPair(...pair)], []));
    }

    static toPair(array) {
        return Array.from(Array(Math.ceil(array.length/2)), (_, i) => array.slice(i*2, i*2+2));
    }

    static hashPair(a, b = a) {
        return SHA256(`${a}${b}`);
    }

    static verifySignature(publicKey, signature, dataHash) {
        return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
    }

    static hash(data) {
        return SHA256(JSON.stringify(data)).toString();
    }

    static id() {
        return uuidV1();
    }

    static genKeyPair() {
        return ec.genKeyPair();
    }
}

module.exports = ChainUtil;
