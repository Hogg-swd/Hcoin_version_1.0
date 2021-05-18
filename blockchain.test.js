const Blockchain = require('./blockchain');

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

var chain = new Blockchain();
//Balance working correctly
test('Correctly works out balance', () => {
  expect(chain.checkBalance(chain.publicKey)).toBe(5000)
})

test('Correctly returns the lastest block in the chain', () => {
  expect(chain.getLatestBlock().hash).toBe("GenBlockHash")
})

test('Correctly mines a block and adds it to the blockchain', () => {
  let transaction = new Transaction("REWARD", this.publicKey, 10)
  chain.mineBlock()
  expect(chain.bc.length).toBe(2)
})

test('Correctly generates the gen block hash', () => {
  expect(chain.generateGenBlock().hash).toBe("GenBlockHash")
})

test('Correctly generates the gen block prevHash', () => {
  expect(chain.generateGenBlock().prevHash).toBe("0")
})
