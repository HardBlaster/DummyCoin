const ChainUtil = require('../chain-util');
const { DIFFICULTY, MINE_RATE } = require('../config');

class Block {
    constructor(timestamp, lastHash, hash, data, nonce, difficulty) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty || DIFFICULTY;
    }

    toString() {
        return `Block -
            Timestamp  : ${this.timestamp}
            Last Hash  : ${this.lastHash.substring(0, 10)}
            Hash       : ${this.hash.substring(0, 10)}
            Nonce      : ${this.nonce}
            Difficulty : ${this.difficulty}
            Data       : ${this.data}`;
    }

    static mineBlock(lastBlock, data) {
        const lastHash = lastBlock.hash;
        let hash, timestamp, nonce = 0;
        let { difficulty } = lastBlock;

        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            hash = Block.doHash(timestamp, lastHash, data, nonce, difficulty);
        } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this(timestamp, lastHash, hash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock, currentTime) {
        let { difficulty } = lastBlock;

        return lastBlock.timestamp + MINE_RATE > currentTime ? difficulty+1 : difficulty-1;
    }

    static doHash(timestamp, lastHash, data, nonce, difficulty) {
        return ChainUtil.hash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
    }

    static blockHash(block) {
        const { timestamp, lastHash, data, nonce, difficulty } = block;

        return Block.doHash(timestamp, lastHash, data, nonce, difficulty);
    }

    static genesis() {
        return new this('Start time', 'NO_LAST_HASH', 'G3N3515-H46H', [], 0, DIFFICULTY);
    }
}

module.exports = Block;
