
var express = require("express");
var bodyParser = require('body-parser');
var Buffer = require('buffer')
var { newKeyPair, pubToAddress } = require('./wallet');
const Blockchain = require('./blockchain')
var {Miner} = require('./miner');
var { initP2PServer, broadcast, responseLatestMsg, sockets, connectToPeers, responseToClient } = require('./lib/network');

var http_port = process.env.HTTP_PORT || 6969;
var blockchain = new Blockchain()
blockchain.genesisBlock()

var miner = new Miner()

var [priKey, pubKey] = newKeyPair()
var walletAddress = pubToAddress(pubKey)
console.log(walletAddress)

require('./lib/network').storeBlockchain(blockchain);

var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(express.static(__dirname + '/public'));
    app.set('view engine', 'ejs')
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
        res.header('Access-Control-Allow-Credentials', true); // If needed
        next();
    })

    app.get('/blocks', (req, res) => {
        return res.json(200, {results: blockchain.queryAllBlocks()})
    });

    app.get('/create-new-wallet', (req, res) => {
        var [privKey, pubKey] = newKeyPair();
        var vinAddress = pubToAddress(pubKey);
        res.send({ privKey, pubKey, vinAddress });
    });

    app.get('/', (req, res) => {
        var blocks = blockchain.queryAllBlocks()
        res.render('home', {
            blocks: blocks
        })
    });

    app.get('/check-validate-chain', (req, res) => {
        return res.json(200, {isValid: blockchain.isValidChain()})
    })
    
    app.get('/transaction', (req, res) => {
        res.render('wallet', {

        })
    });

    app.get('/wallet', (req, res) => {
        res.render('createwallet', {

        })
    });

    app.get('/home', (req, res) => {
        var blocks = blockchain.queryAllBlocks()

        res.render('home', {
            blocks: blocks
        })
    });

    app.get('/txs', (req, res) => {
        var blocks = blockchain.queryAllBlocks()

        res.render('txs', {
            blocks: blocks
        })
    });

    app.post('/add-new-blocks', (req, res) => {
        var newBlock = blockchain.createNewBlock()
        blockchain.addBlock(newBlock)
        return res.json(200, {results: blockchain.queryAllBlocks()});
    });

    app.post('/addPeers', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send('connect success');
    });

    app.get('/peers', (req, res) => {
        console.log(sockets)
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    
    app.get('/transactions', (req, res) => {
        var transactions = blockchain.queryAllTransaction()
        return res.json(200, {error: 200, resutls: transactions})
    })

    app.get('/get-transaction-count', (req, res) => {
        var address = req.param('address')
        if(address === undefined) {
            return res.json(200, {error: 400, message: 'Bad request'})
        }

        var transactionCount = blockchain.getTransactionCount(address)
        return res.json(200, {error: 200, nonce: transactionCount+1})
    })

    app.post('/create-new-transaction', (req, res) => {
        var data = req.body
        if(data === undefined) {
            return res.json(200, {error: 400, message: 'Bad request'})
        }

        if(!data.signature.startsWith('0x')) {
            data.signature = '0x' + data.signature
        }

        var hash = blockchain.createTransaction(data.nonce, data.gasPrice, data.from, data.to, data.value, data.data ,data.signature)

        return res.json(200, {error: 200, message: 'ok', transactionHash: hash})
    })

    app.post('/start-minning', (req, res) => {
        miningBlock(walletAddress)
        return res.json(200, {error: 200, message: 'mined'})
    })

    miningBlock(walletAddress)

    app.listen(http_port, () => {
        console.log('Listening http on port: ' + http_port)
    });
};

function miningBlock(minningRewardAddress) {
    setInterval(function () {
        var latestBlock = blockchain.getLastestBlock();
        var newBlock = blockchain.createNewBlock(latestBlock.getHash());// create block random from latestBlock
        var minedBlock = miner.mineBlock(minningRewardAddress, 5, newBlock);// call minning
        blockchain.addBlock(minedBlock);

        //boardcast new block to all nodes here
        broadcast(responseLatestMsg())
        broadcast(responseToClient(blockchain.queryAllBlocks()))
    }, 60000);// one minning per / 15 second
}


initHttpServer();
initP2PServer();
