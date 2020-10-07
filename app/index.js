const express = require('express');
const Blockchain = require('../blockchain');
const ChainUtil = require('../chain-util');
const bodyParser = require('body-parser');
const P2PServer = require('./p2p-server');
const Miner = require('./miner');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();

const p2pServer = new P2PServer(blockchain, transactionPool);
const miner = new Miner(blockchain, transactionPool, wallet, p2pServer);

const app = express();
app.use(bodyParser.json());

app.get('/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.get('/transactions', (req, res) => {
    res.json(transactionPool.transactions);
});

app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey});
});

app.get('/mine-transactions', (req, res) => {
    const block = miner.mine();
    console.log(`New block? ${block.toString()}`);

    res.redirect('/blocks');
});

app.get('/merkle-root', (req, res) => {
    const merkleRoot = ChainUtil.getMerkleRoot(transactionPool.validTransactions().map(transaction => transaction.input.signature));
    console.log(`Merkle root: ${merkleRoot}`);

    res.json({merkleRoot});
});

app.post('/mine', (req, res) => {
    const block = blockchain.addBlock(req.body.data);
    console.log(`A new block has been added to the chain: ${block.toString()}`);

    p2pServer.syncChains();
    res.redirect('/blocks');
});

app.post('/transact', (req, res) => {
    const { recipient, amount } = req.body;
    const transaction = wallet.createTransaction(recipient, amount, blockchain, transactionPool);
    p2pServer.broadcastTransaction(transaction);

    res.redirect('/transactions');
});

app.listen(HTTP_PORT, () => console.log(`Listening HTTP request on port ${HTTP_PORT}`));
p2pServer.listen();
