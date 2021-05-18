var sha256 = require('js-sha256');
const https = require('https');
var request = require('request');
var crypto = require('crypto');
var fs = require("fs");

class Transaction {
  constructor(sender, reciever, amount, date = new Date()){
    this.sender = sender;
    this.reciever = reciever;
    this.amount = amount;
    this.date = date
    this.sig = ""
  }
  setSignature(sig) {
    this.sig = sig
  }
}

class Block {

  constructor(data, prevHash, blockNumber, timestamp = new Date()){
    this.data = data;
    this.hash = this.createHash();
    this.prevHash = prevHash;
    this.timestamp = timestamp;
    this.blockNumber = blockNumber;
    this.guess = 0;
  }

  createHash(){
    return JSON.stringify(sha256(JSON.stringify(this.data)
    + this.index
    + this.timestamp
    + this.prevHash
    + this.guess));
  }

   toString() {
    var ret =  {"index" : this.index, "timestamp" : this.timestamp, "prevHash" : this.prevHash, "guess" : this.guess}
    return JSON.stringify(ret);
  }

  mine(diff){
    let nounce = ""
    for (var i = 0; i < diff; i++) {
      nounce += '0'
    }
    console.log(nounce)
    while(!(this.hash.substring(1, diff+1) == nounce)){
        console.log(this.hash.substring(1, diff+1))
        this.guess++;
        this.hash = this.createHash();
    }
  }

}

class BlockChain {
  constructor(){
    this.publicKey = fs.readFileSync('./publicKey.pem', 'utf8')
    this.bc = [this.generateGenBlock()];
    this.transactions = [];
    this.blockNu = 1;
    this.diff = 4;
  }

  keyGen(){
    var diff = crypto.createDiffieHellman(60)
    diff.generateKeys('base64')
    return diff.getPublicKey('hex')
  }

  generateGenBlock(){
    let block = new Block([new Transaction("REWARD", this.publicKey, 5000)], "0", 0);
    block.hash = "GenBlockHash"
    return block;
  }

  getLatestBlock(){
    return this.bc[this.bc.length -1]
  }

  mineBlock(){
    //ADD PUBLIC KEY
    try {
      var block = new Block(this.transactions, this.getLatestBlock().hash, this.blockNu);
      block.mine(this.diff);
      this.transactions = [];
      this.transactions.push(new Transaction("REWARD", this.publicKey, 10));
      this.bc.push(block);
      this.blockNu += 1;
    } catch (err) {
      console.log(err);
    }

  }

  //client side maybe take out of BlockChain class
  checkBalance(walletAddress){
    var balance = 0;
    for(var i = 0; i < this.bc.length; i++){
      for(var j = 0; j < this.bc[i].data.length; j++){
        if(this.bc[i].data[j].reciever == walletAddress){
          balance += this.bc[i].data[j].amount;
        } else if (this.bc[i].data[j].sender == walletAddress) {
          balance -= this.bc[i].data[j].amount;
        }
      }

    }
    return balance;
  }

  addTransaction(sender, reciever, amount, signature){
    try {
      amount = parseInt(amount)
      var balance = this.checkBalance()
      if(balance >= amount){
        var transaction = new Transaction(sender, reciever, amount)
        transaction.setSignature(signature)
        this.transactions.push(transaction)
      }
    } catch {
      console.log("Incorrect amount")
    }
    //var balance = this.checkBalance(transaction.senderWallet);
    //if(balance >= transaction.amount){
      //  this.transactions.push(transaction);
      //}
  }


}




module.exports = BlockChain;
