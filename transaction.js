const CryptoJS = require('crypto-js')

class Transaction {
    constructor(nonce, gasPrice, from, to, value, data, signature) {
        this.nonce = nonce || 0
        this.gasPrice = gasPrice || 0
        this.from = from || '0x'
        this.to = to || '0x'
        this.value = value || 0
        this.data = data || ''
        this.r = '0x' + signature.slice(0,62) || '0x'
        this.s = '0x' + signature.slice(64,125) || '0x'
        this.status = 0x0
    }

    toJSON() {
        return {
            hash: this.hash,
            nonce: this.nonce,
            gasPrice: this.gasPrice,
            from: this.from,
            to: this.to,
            value: this.value,
            data: this.data,
            signature: this.r + this.s.slice(2),
            status: this.status
        }
    }

    generateHash() {
        this.hash = '0x' + CryptoJS.SHA256(this.nonce + this.from + this.to + this.value + this.data + this.r + this.s).toString()
        return this.hash
    }

    getHash() {
        return this.hash
    }
}

module.exports = Transaction