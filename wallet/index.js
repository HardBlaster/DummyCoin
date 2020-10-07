const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');
const { INITIAL_BALANCE } = require('../config');

class Wallet {
    constructor() {
        this.ballance = INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    calculateBalance(blockchain) {
        let balance = this.ballance;
        let transactions = [];
        blockchain.chain.forEach(block => block.data.forEach(transaction => {
            transactions.push(transaction);
        }));

        const walletInputTransactions = transactions.filter(transaction => transaction.input.address === this.publicKey);

        let startTime = 0;
        if(walletInputTransactions.length > 0) {
            const recentInputTransactions = walletInputTransactions.reduce((prev, current) =>
                prev.input.timestamp > current.input.timestamp ? prev : current);

            balance = recentInputTransactions.output.find(output => output.address === this.publicKey).amount;
            startTime = recentInputTransactions.input.timestamp;
        }

        transactions.forEach(transaction => {
            if(transaction.input.timestamp > startTime) {
                transaction.output.find(output => {
                    if (output.address === this.publicKey) {
                        balance += output.amount;
                    }
                })
            }
        })

        return balance;
    }

    createTransaction(recipient, amount, blockchain, transactionPool) {
        this.ballance = this.calculateBalance(blockchain);

        if(amount > this.ballance) {
            return;
        }

        let transaction = transactionPool.existingTransaction(this.publicKey);
        if(transaction) {
            transaction.update(this, recipient, amount);
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount);
            transactionPool.updateOrAddTransaction(transaction);
        }

        return transaction;
    }

    sign(dataHash) {
        return this.keyPair.sign(dataHash);
    }

    toString() {
        return `Wallet - 
        publicKey : ${this.publicKey.toString()}
        balance   : ${this.ballance}`
    }

    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.address = 'blockchain-wallet';

        return blockchainWallet;
    }
}

module.exports = Wallet;
