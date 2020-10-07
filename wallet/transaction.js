const ChainUtil = require('../chain-util');
const { MINING_REWARD } = require('../config');

class Transaction {
    constructor() {
        this.id = ChainUtil.id();
        this.input = null;
        this.output = [];
    }

    update(senderWallet, recipient, amount) {
        const senderOutput = this.output.find(output => output.address === senderWallet.publicKey);

        if(amount > senderOutput.amount) {
            return;
        }

        senderOutput.amount = senderOutput.amount - amount;
        this.output.push({ amount, address: recipient });

        Transaction.signTransaction(this, senderWallet);

        return this;
    }

    static rewardTransaction(minerWallet, blockchainWallet) {
        return Transaction.transactionWithOutputs(blockchainWallet, [{
            amount: MINING_REWARD,
            address: minerWallet.publicKey,
        }])
    }

    static transactionWithOutputs(senderWallet, outputs) {
        const transaction = new this();
        transaction.output.push(...outputs);
        Transaction.signTransaction(transaction, senderWallet);

        return transaction;
    }

    static newTransaction(senderWallet, recipient, amount) {
        const transaction = new this();

        if (amount > senderWallet.ballance) {
            console.log(`Amount: ${amount} exceeds balance`);
            return;
        }

        return Transaction.transactionWithOutputs(senderWallet, [
            { amount: senderWallet.ballance - amount,
                address: senderWallet.publicKey },
            { amount, address: recipient },
        ]);
    }

    static signTransaction(transaction, senderWallet) {
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.ballance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.hash(transaction.output)),
        }
    }

    static verifyTransaction(transaction) {
        return ChainUtil.verifySignature(
            transaction.input.address,
            transaction.input.signature,
            ChainUtil.hash(transaction.output),
        );
    }
}

module.exports = Transaction;
