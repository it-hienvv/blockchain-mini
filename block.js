const MerkleRoot = require('merkle-tools')
const CryptoJS = require('crypto-js')
const Header = require('./header')

class Block {
    constructor(header, transactions) {
        this.header = header || new Header()
        this.data = transactions || []
    }

    toJSON() {
        return {
            header: this.header.toJSON(),
            data: this.data
        }
    }

    generateHash() {
        this.header.generateHash()
    }

    getHash() {
        return this.header.hash
    }

    generateRootHash() {
        var arrayHash = []
        this.data.forEach(transaction => {
            arrayHash.push(transaction.getHash())
        })

        var merkleInputs = arrayHash.map(x => new Buffer(x, 'hex'))
        var merkleRoot = new MerkleRoot()
        merkleRoot.addLeaves(merkleInputs)
        merkleRoot.makeTree()

        var rootHex = merkleRoot.getMerkleRoot()
        if(rootHex) {
            this.header.root = rootHex
        }
    }
}
module.exports = Block