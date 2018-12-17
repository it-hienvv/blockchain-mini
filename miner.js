const CryptoJS = require('crypto-js')

var Miner = function () {
    
}


Miner.prototype = this;

Miner.prototype.calculateHash = (block) => {
    return CryptoJS.SHA256(block.header.nonce + block.header.number + block.header.prevHash + block.header.root + block.header.timestamp).toString()
}

Miner.prototype.mineBlock = (rewardAddress, difficulty, block) => {
    var hash = block.header.hash.slice(2)

    while (hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
        //incrementing the nonce value everytime the loop runs.
        // console.log("Mining ....");
        block.header.nonce++;
        //recalculating the hash value
        hash = this.calculateHash(block)
    }

    block.header.coinbase = rewardAddress
    block.generateHash()

    return block;
}

module.exports = { Miner }
