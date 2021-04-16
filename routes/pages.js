const express = require('express');
const Blockchain = require('../blockchain')
const router = express.Router();
const fs = require('fs');
const pk = "publickeytest"
var bodyParser = require('body-parser');
var request = require('request');
var routing_server_address = "http://localhost:5001/"
var updated = false;
var urls = []

const chain = new Blockchain();

//create helper to get res.body of the chain into a useable form

router.get('/', (req, res) => {
  let msg = ""
  if(!updated){msg = "Chain is not Synct"} else {msg = "Chain up to date"}
  res.render('index', {urls : urls});
});

router.get('/chain', (req, resp) => {
  resp.render('chain', {chain : chain})
})

router.get('/transactions', (req, resp) => {
  resp.render('transactions', {chain : chain})
})


router.post('/update', (req, resp) => {
  request(routing_server_address, function (err, res) {
    if(err) return console.error(err.message);
    urls = res.body
  });
  resp.redirect('/')
})

router.post('/addTransaction', (req, res) => {
  chain.addTransaction(req.body.reciever, req.body.amount)
  console.log(chain.publicKey)
  res.redirect('transactions')
})

//helper function
function isValidChain(reschain, chain){
  let valid = True
  for (var i = 0; i < chain.length; i++) {if(chain[i].hash != resChain[i].hash || chain[i].prevHash != resChain[i].prevHash) {valid = False;}
  if(resChain.length > chain.length){
    for (var i = chain.length; i < resChain.length; i++) {
      if(reschain[i].prevHash == reschain[i-1].hash)
    }
  } else {valid = False;}
  return valid
}
router.get('/sync', (req, res) => {
  for (var i = 0; i < urls.length; i++) {
    let resChain = sendRequest(urls[i])
    if(chain.length < resChain.length && isValidChain(resChain)){
      chain = resChain
    }


  }
})


router.post('/mine', (req, res) => {
  chain.mineBlock()
  res.redirect('chain')
})


module.exports = router;
