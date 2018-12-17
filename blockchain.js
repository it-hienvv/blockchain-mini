const CryptoJS = require('crypto-js')
const Block = require('./block')
const Header = require('./header')
const Transaction = require('./transaction')
var { broadcast, newTransaction } = require('./lib/network')

class Blockchain {
    constructor() {
        this.chain = []
        this.nodes = []
        this.transactions = []
    }

    genesisBlock() {
        var header = new Header(0, '0x', '0x', 0, '0', '0x', 1539335257487)
        var block = new Block(header)
        block.generateRootHash()
        block.header.generateHash()
        this.chain.push(block)
    }

    createNewBlock(previousHash) {
        const prevHash = previousHash || this.getLastestBlock().header.hash
        var header = new Header(0, prevHash, '0x', this.chain.length, 0, '0x')
        var block = new Block(header, this.transactions)
        block.generateRootHash()
        block.generateHash()

        return block
    }

    addBlock(block) {
        if(this.isValidBlock(block, this.getLastestBlock())) {
            block.data.forEach(transaction => {
                transaction.status = 0x1
            })

            this.chain.push(block)
            this.transactions = []

            return true
        }

        return false
    }

    getLastestBlock() {
        return this.chain[this.chain.length - 1]
    }

    isValidBlock(newBlock, prevBlock) {
        if(newBlock.header.prevHash != prevBlock.header.hash) {
            return false
        }

        return true
    }

    isValidChain(newChain) {
        var block = null
        var lastBlock = newChain[0]
        var index = 1

        while(index < newChain.length) {
            block = newChain[index]
            if(block.header.prevHash != lastBlock.header.hash) {
                return false
            }

            lastBlock = block
            index++
        }

        return true
    }

    //create new transaction
    createTransaction(nonce, gasPrice, from, to, value, data, signature) {
        var transaction = new Transaction(nonce, gasPrice, from, to, value, data, signature)
        transaction.generateHash()
        this.transactions.push(transaction)

        //need boardcast transaction to all nodes here
        console.log('transaction',transaction);
        broadcast(newTransaction(transaction));
        return transaction.hash
    }

    resloveConflicts() {
        // var newChain = null
        // var maxLength = this.chain.length
        // this.nodes.forEach(node => {
            
        // })
    }

    dataToBlock(datas) {
        let newChain = [];
        for(let i = 0; i < datas.length; i++) {
            var obj = datas[i]
            var header = this.dataToHeader(obj.header)
            var transactions = []
            obj.data.forEach(trans => {
                transactions.push(this.dataToTransaction(trans))
            })

            newChain.push(new Block(header, transactions))
        }

        return newChain
    }

    dataToHeader(data) {
        var header = new Header(data.nonce, data.prevHash, data.coinbase, data.number, data.difficulty, data.root, data.timestamp);
        header.hash = data.hash

        return header
    }

    dataToTransaction(data) {
        let transaction = new Transaction(data.nonce, data.gasPrice, data.from, data.to, data.value, data.data, data.signature);
        transaction.status = data.status;
        transaction.hash = data.hash;
        
        return transaction;
    }

    queryAllBlocks() {
        var blocks = []
        this.chain.forEach(block => {
            blocks.push(block.toJSON())
        })
        return blocks
    }

    queryAllTransaction() {
        var transactions = []
        this.chain.forEach(block => {
            block.data.forEach(transaction => {
                transactions.push(transaction.toJSON())
            })
        })

        return transactions
    }

    getTransactionCount(address) {
        var count = 0
        if(address === undefined) {
            this.chain.forEach(block => {
                block.data.forEach(transaction => {
                    count++
                })
            })
        }else{
            this.chain.forEach(block => {
                block.data.forEach(transaction => {
                    if(transaction.from === address) {
                        count++
                    }
                })
            })
        }

        return count
    }


    replaceChain(newChain, cb) {
        if (this.isValidChain(newChain) && newChain.length > this.chain.length) {
            console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
            this.chain = newChain;
            if(cb) {
                cb(newChain);
            }
        } else {
            console.log('Received blockchain invalid');
        }
    }
}

module.exports = Blockchain