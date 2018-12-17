var CryptoJS = require('crypto-js');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

var newKeyPair = () => {
    var key = ec.genKeyPair();
    var privKey = key.getPrivate('hex');
    var pubPoint = key.getPublic();
    var pubKey = pubPoint.encode('hex');
    return [privKey, pubKey];
}

// var [privKey, pubKey] = newKeyPair();
// console.log("priv", privKey, '\n');
// console.log("pubkey", pubKey, '\n');

var pubToAddress = (pubKey) => {
    let addressHash = CryptoJS.SHA256(pubKey).toString(CryptoJS.enc.Hex);
    
    let vinAddress = addressHash.slice(-40);
    return "0x" + vinAddress;
}
//console.log(pubToAddress(pubKey), '\n');

exports.newKeyPair = newKeyPair;
exports.pubToAddress = pubToAddress;

var ECDSASIGN = (data, privKey) => {
    //data must be an arr or hex-string;
    var priv = ec.keyFromPrivate(privKey, 'hex');
    var msgHash = Buffer.from(JSON.stringify(data));
    var signature = priv.sign(msgHash);
    return signature;
}

//var signature = ECDSASIGN([1,2,3,4,5], privKey);

//console.log('sign', signature);

var verification = (data, pubKey, signature) => {
    //data must be an arr or hex-string
    var msgHash = Buffer.from(JSON.stringify(data));
    var key = ec.keyFromPublic(pubKey, 'hex');
    return key.verify(msgHash, signature);
}

module.exports = {
    newKeyPair: newKeyPair,
    pubToAddress: pubToAddress,
    ECDSASIGN: ECDSASIGN,
    verification: verification
}
