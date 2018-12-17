CREATE TABLE IF NOT EXISTS accountState (
    nonce INT NOT NULL DEFAULT 1,
    balance INT NOT NULL DEFAULT 0, 
    codehash CHAR(256) NOT NULL
);

CREATE TABLE IF NOT EXISTS `transaction` (
    nonce INT NOT NULL DEFAULT 0,
    gasPrice INT NOT NULL,
    gasLimit INT NOT NULL,
    recipient CHAR(32) NOT NULL,
    amount INT NOT NULL,
    `signature` INT NOT NULL
);
