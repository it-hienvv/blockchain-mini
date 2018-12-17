const CryptoJS = require('crypto-js')

class Header {
    constructor(nonce, prevHash, coinbase, number, difficulty, rootHash, timestamp) {
        this.nonce = nonce || 0
        this.prevHash = prevHash || '0x' //previous hash
        this.coinbase = coinbase || '0x' //miner address
        this.number = number || 0 //index
        this.difficulty = difficulty || 0
        this.root = rootHash || '0x'
        this.timestamp = timestamp || new Date().getTime()
    }

    toJSON() {
        return {
            nonce: this.nonce,
            hash: this.hash,
            prevHash: this.prevHash,
            coinbase: this.coinbase,
            number: this.number,
            difficulty: this.difficulty,
            timestamp: this.timestamp
        }
    }

    generateHash() {
        this.hash = '0x' + CryptoJS.SHA256(this.nonce + this.number + this.prevHash + this.root + this.timestamp).toString()
        return this.hash
    }
}

module.exports = Header
