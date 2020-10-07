const Transaction = require('./transaction');

class TransactionPool {
    constructor() {
        this.transactions = [];
    }

    clear() {
        this.transactions = [];
    }

    updateOrAddTransaction(transaction) {
        let transactionWithId = this.transactions.find(t => t.id === transaction.id);

        if(transactionWithId) {
            this.transactions[this.transactions.indexOf(transactionWithId)] = transaction;
        } else {
            this.transactions.push(transaction);
        }
    }

    existingTransaction(address) {
        return this.transactions.find(t => t.input.address === address);
    }

    validTransactions() {
        return this.transactions.filter(transaction => {
           const outputTotal = transaction.output.reduce((total, output) => {
               return total + output.amount;
           }, 0);

           if(transaction.input.amount !== outputTotal) {
               return;
           }

           if(!Transaction.verifyTransaction(transaction)) {
               return;
           }

           return transaction;
        });
    }
}

module.exports = TransactionPool;
