//Dependiencey importing
const express = require('express');
const Blockchain = require('../blockchain');
var bodyParser = require('body-parser');
const request = require("request-promise");
const crypto = require("crypto");
const got = require('got')
var fs = require("fs");
var qrcode = require('qrcode');

//creating router object
const router = express.Router();

var routing_server_address = "http://localhost:3000/urls";
var updated = false;
var urls = [];
var mutBlockChain = [];

var chain = new Blockchain();
var pk = chain.publicKey;

class Transaction {
  constructor(sender, reciever, amount, date = new Date()){
    this.sender = sender;
    this.reciever = reciever;
    this.amount = amount;
    this.date = date
    this.sig = ""
  }
  setSignature(sig) {
    this.sig = sig;
  }
}

//HELPER FUNCTIONS
//Takes a list of transactions as input and return a filtered list of valid transactions
const removeInvalidTransactions = transactions => {
  let filtered = [];
  let transactionsWithoutReward = transactions;

  if(transactions.length < 2){ return filtered }

  transactionsWithoutReward.forEach((t, i) => {
    if(i == 0 && (t.sender == 'REWARD' && t.amount == 10)){ filtered.push(t) }
    else if(isValidTransaction(t)){filtered.push(t)}
  });

  return filtered;
}

//Takes a transaction as input and returns a true if transaction is valid and false otherwise
const isValidTransaction = transaction =>{
  try {
    let pk = transaction.sender;
    const signature = transaction.sig;

    verifier = crypto.createVerify("RSA-SHA256");
    console.log(transaction.date)
    console.log(transaction)
    verifier.update(pk + transaction.reciever + transaction.amount + transaction.date);
    result = verifier.verify(pk, signature, "hex");

    let balance = chain.checkBalance(pk);
    if(balance < transaction.amount){return False;}

    console.log(result);
    return result;

  } catch (e) {
    console.log(e);
    return false;
  }
}


//Takes a block and transaction as input and sends to all nodes in the network
const sendBlock = (block, transaction) => {
  console.log(urls)
  urls.forEach((url, i) => {
    const options = {
      url: urls[i] + 'block',
      json: true,
      body: {
          block : block,
          reward : transaction
      }
    };

    request.post(options, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${res.statusCode}`);
    });
  });

}

//Takes a JSON block as input return true if the block is valid and false otherwise
const isValidBlock = block => {
  if(!(block.prevHash == chain.bc[chain.bc.length-1].hash)){console.log(chain.bc[chain.bc.length-1].hash); console.log(block.prevHash); return false;}
  let validTransactions = removeInvalidTransactions(block.data);
  return validTransactions.length == block.data.length;
}

//Takes a chain as JSON chain as input return true if the chain is valid and false otherwise
const isValidChain = chain => {
  chain.forEach((block) => {
    if(!(isValidBlock(block))){return false;}
  });
  return true;
}

//Takes a list of JSON transcations and returns a list of transactions without already valided transactions
const removeCompleteTransactions = transactions => {
  pendingTransactions = [];
  for (var i = 0; i < chain.transactions.length; i++) {
    for (var j = 0; j < transaction.length; i++) {
      if(!(transaction[j].sig == chain.transaction[i])){
        pendingTransactions.push(transaction)
      }
    }
  }
  return pendingTransactions;
}

//Call the update chain function for each url in the server list
const requestChain = () => {
  urls.forEach((url) => {
    updateChain(url + 'chainRequest')
  });
}

//Takes a URL string as input and sends a get request for the chain to all nodes on the network
// Then updates the mutatable temp block chain
const updateChain = async url => {
  try {
    const resp = await got(url);
    let chainAsString = resp.body
    let bc = JSON.parse(chainAsString)
    if(mutBlockChain.length < bc.length){mutBlockChain = bc}

  } catch (e) {
    console.log(e);
    return;
  }
}

// Function to update the urls
const updateUrls = async () => {
  try {
    const resp = await got(routing_server_address);
    let listAsString = resp.body;
    listAsString = listAsString.replace(/]/g, "");
    listAsString = listAsString.replace(/\[/g, "");
    listAsString = listAsString.replace(/"/g, "");
    urls = listAsString.split(',')
  } catch (e) {console.log(e);}
}

// Function that takes in a key as input and creates a qr code representation of it
const generateQRpub = async key => {
  try {
    await qrcode.toFile('./public/publicKey.png', key);
  } catch (err) {
    console.error(err)
  }
}

generateQRpub(pk)

//POST AND GET ROUTES RESTFUL API

//GET route handler for the index page
router.get('/', (req, res) => {
  let msg = "";
  if(!updated){msg = "Chain is not Synct"} else {msg = "Chain up to date"}
  res.render('index', {urls : urls, transactions : chain.transactions, chain : chain});
});

//GET route handler for the chain page
router.get('/chain', (req, resp) => {
  resp.render('chain', {chain : chain});
})

//GET request to send chain to the Hcoin network
router.get('/chainRequest', (req, res) => {
  console.log(chain.bc)
  res.send(chain.bc)
})

//POST request to sync the chain
router.post('/sync', (req, res) => {
  requestChain()
  if(chain.bc.length < mutBlockChain.length && isValidChain(mutBlockChain)){
    console.log("test"); chain.bc = mutBlockChain;
    chain.blockNu = chain.bc.length;
    chain.transactions = removeCompleteTransactions(chain.transactions);
  }
  res.redirect('/')
})

//POST request to update the Hcoin network list
router.post('/update', (req, resp) => {
  request(routing_server_address, function (err, res) {
    if(err) return console.error(err.message);
    updateUrls();
    console.log(urls);
  });
  resp.redirect('/');
})

//POST request for handling adding a new transaction recieved from the wallet
router.post('/addTransaction', (req, res) => {
  transaction = new Transaction(req.body.sender, req.body.reciever ,req.body.amount);
  transaction.date = req.body.date;
  console.log(transaction.date)
  transaction.sig = req.body.sig;
  chain.transactions.push(transaction);
})

//POST request to send transaction list to the supplied wallet address
router.post('/transactionRequest', (req, res) => {

  let pk = req.body.pub
  console.log(pk)
  let packet = []
  chain.bc.forEach((block) => {
    block.data.forEach((transaction) => {
        if(transaction.sender == pk || transaction.reciever == pk){packet.push(transaction)}
    });
  });
  console.log(packet)
  res.send(packet)
})

router.post('/mine', (req, res) => {
  let filterdTransactions = removeInvalidTransactions(chain.transactions);
  console.log(chain.transactions);
  if(filterdTransactions.length > 1){
    chain.transactions = filterdTransactions;
    chain.mineBlock();
    sendBlock(chain.bc[chain.bc.length-1], chain.transactions[0]);
  }
  res.redirect('chain')
})

router.post('/transaction', (req, res) => {
  let transaction = res.body
  chain.addTransaction(transaction)
})

router.post('/block', (req, res) => {
  let block = req.body.block;
  let reward = req.body.reward;
  if(isValidBlock(block)){
    chain.bc.push(block);
    chain.transactions = removeCompleteTransactions(block.data);
    chain.transactions.unshift(reward);
    chain.blockNu = block.blockNumber
  }
  res.redirect('chain');
})

module.exports = router;
