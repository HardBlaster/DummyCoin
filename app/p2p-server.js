const WebSocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPES = {
    chain: 'CHAIN',
    transaction: 'TRANSACTION',
    clear_transactions: 'CLEAR_TRANSACTIONS'
};

class P2PServer {
    constructor(blockchain, transactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.sockets = [];
    }

    listen() {
        const server = new WebSocket.Server({ port: P2P_PORT });
        server.on('connection', socket => this.connectSocket(socket));
        this.connectToPeers();

        console.log(`Listening for p2p socket connections on: ${P2P_PORT} port`);
    }

    connectToPeers() {
        peers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => this.connectSocket(socket));
        })
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log(`Socket has been connected.`);

        this.msgHandler(socket);
        this.sendChain(socket);
    }

    msgHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);
            switch (data.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(data);
                    break;
                case MESSAGE_TYPES.transaction:
                    this.transactionPool.updateOrAddTransaction(data.transaction);
                    break;
                case MESSAGE_TYPES.clear_transactions:
                    this.transactionPool.clear();
                    break;
            }


        })
    }

    sendTransaction(socket, transaction) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.transaction,
            transaction,
        }));
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.chain,
            chain: this.blockchain.chain }));
    }

    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => {
            this.sendTransaction(socket, transaction);
        });
    }
    broadcastClearTransactions() {
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: MESSAGE_TYPES.clear_transactions
            }));
        })
    }
}

module.exports = P2PServer;