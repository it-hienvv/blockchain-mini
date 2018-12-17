var p2p_port = process.env.P2P_PORT || 8080;
var WebSocket = require("ws");
var { fix_finger_table, finger_table } = require('../fakenetwork');
var blockchain;

exports.storeBlockchain = (storeblockchain) => {
    blockchain = storeblockchain;
}

var sockets = [];

var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_NEIGHBORHOOD: 3,
    RESPONSE_NEIGHBORHOOD: 4,
    NEW_TRANSACTION: 5,
    RESPONSE_CLIENT: 6,
};


var initP2PServer = function() {
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};


var initConnection = function(ws) {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
    broadcast(queryNeighborhood());
}

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
            case MessageType.QUERY_NEIGHBORHOOD:
                write(ws, responseNeighborhood());
                break;
            case MessageType.RESPONSE_NEIGHBORHOOD:
                let new_finger_table = message.data;
                if(new_finger_table) {
                    connectToPeers(new_finger_table);
                }
                break;
            case MessageType.NEW_TRANSACTION:
                console.log('NEW_TRANSACTION', blockchain, message.data);
                blockchain.transactions.push(blockchain.dataToTransaction(message.data));
                break;
        }
    });
};


var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        fix_finger_table(peer, (err, result) => {
            if(err) return console.log(err);
            var ws = new WebSocket(peer);
            ws.on('open', () => initConnection(ws));
            ws.on('error', () => {
                console.log('connection failed')
            });
        })
    });
};

var handleBlockchainResponse = (message) => {
    var jsonArray = JSON.parse(message.data).sort((b1, b2) => (b1.header.number - b2.header.number));
    var receivedBlocks = blockchain.dataToBlock(jsonArray)

    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHold = blockchain.getLastestBlock();
    console.log(latestBlockReceived)
    console.log(latestBlockHold)

    if (latestBlockReceived.header.number > latestBlockHold.header.number) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHold.header.number + ' Peer got: ' + latestBlockReceived.header.number);
        if (latestBlockHold.header.hash === latestBlockReceived.header.previousHash) {
            console.log("We can append the received block to our chain");
            blockchain.addBlock(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            blockchain.replaceChain(receivedBlocks, function onSuccess(newChain) {
                broadcast(responseToClient(JSON.stringify(newChain)));
            });
        }
    } else {
        console.log('received blockchain is not longer than current blockchain. Do nothing');
    }
};

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

//message socket
var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var queryNeighborhood = () => ({ 'type' : MessageType.QUERY_NEIGHBORHOOD });

var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([blockchain.getLastestBlock()])
});

var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain.queryAllBlocks())
});

var responseNeighborhood = () => ({
    'type': MessageType.RESPONSE_NEIGHBORHOOD, 'data': finger_table
});

var responseToClient = (chain) => {
    console.log('chain',chain);
    return {
        'type': MessageType.RESPONSE_CLIENT, 'data': chain
    }
};

var newTransaction = (newTransaction) => ({
    'type': MessageType.NEW_TRANSACTION, 'data': newTransaction
});


exports.initP2PServer = initP2PServer;
exports.responseLatestMsg = responseLatestMsg;
exports.broadcast = broadcast;
exports.sockets = sockets;
exports.connectToPeers = connectToPeers;
exports.newTransaction = newTransaction;
exports.responseToClient = responseToClient;




