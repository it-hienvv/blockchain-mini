// var CryptoJS = require('crypto-js');
// var Block = require('../block');

// var Utils = function() {

// }

// Utils.prototype = this;

// getGenesisBlock = () => {
//     return new Block(0, "0", 1465154705, "my genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
// };

// var blockchain = [getGenesisBlock()];

// Utils.prototype.calculateHash = (index, previousHash, timestamp, data) => {
//     return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
// };

// Utils.prototype.getLatestBlock = () => {
//     return blockchain[blockchain.length - 1];
// }

// Utils.prototype.addBlock = (newBlock) => {
//     if (this.isValidNewBlock(newBlock, this.getLatestBlock())) {
//         blockchain.push(newBlock);
//     }
// };

// Utils.prototype.generateNextBlock = (blockData) => {
//     var previousBlock = this.getLatestBlock();
//     var nextIndex = previousBlock.index + 1;
//     var nextTimestamp = new Date().getTime() / 1000;
//     var nextHash = this.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
//     return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
// };

// Utils.prototype.isValidNewBlock = (newBlock, previousBlock) => {
//     if (previousBlock.index + 1 !== newBlock.index) {
//         console.log('invalid index');
//         return false;
//     } else if (previousBlock.hash !== newBlock.previousHash) {
//         console.log('invalid previoushash');
//         return false;
//     } else if (this.calculateHashForBlock(newBlock) !== newBlock.hash) {
//         console.log('invalid hash: ' + this.calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
//         return false;
//     }
//     return true;
// };


// Utils.prototype.isValidChain = (blockchainToValidate) => {
//     if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
//         return false;
//     }
//     var tempBlocks = [blockchainToValidate[0]];
//     for (var i = 1; i < blockchainToValidate.length; i++) {
//         if (this.isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
//             tempBlocks.push(blockchainToValidate[i]);
//         } else {
//             return false;
//         }
//     }
//     return true;
// };


// Utils.prototype.calculateHashForBlock = (block) => {
//     return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
// };

// Utils.prototype.replaceChain = (newBlocks) => {
//     if (this.isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
//         console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
//         blockchain = newBlocks;
//         //broadcast(responseLatestMsg());
//     } else {
//         console.log('Received blockchain invalid');
//     }
// };

// Utils.prototype.queryAllBlock = function() {
//     return blockchain;
// };


// module.exports = {
//     Utils
// }