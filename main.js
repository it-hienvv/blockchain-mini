var express = require("express");
var bodyParser = require('body-parser');
var wallet = require('./wallet');
var http_port = process.env.HTTP_PORT || 6969;
var { Utils } = require('./lib/Blockchain');
const Blockchain = require('./blockchain')
var utils = new Utils();
var { initP2PServer, broadcast, responseChainMsg, sockets, connectToPeers } = require('./lib/network');
var blockchain = new Blockchain()
blockchain.genesisBlock()
var transaction = require('./transaction');
var {Miner} = require('./miner');
var miner = new Miner();

var privateKey = wallet.newKeyPair()[0];
console.log(privateKey);
var sign = wallet.ECDSASIGN("Tran no", privateKey);
blockchain.createTransaction(10, 1000, "So nha 70", "Lac Long Quan", 10, "Tra no", sign);

var latestBlock = blockchain.getLastestBlock();
console.log("Lastest Block", latestBlock.header.number);
var newBlock = blockchain.createNewBlock(latestBlock.header.prevHash);
var miningBlock = miner.mineBlock(3, newBlock);
console.log(miningBlock);
console.log(newBlock);
// Test file minning Block


