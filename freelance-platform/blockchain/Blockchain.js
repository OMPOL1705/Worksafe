/**
 * Blockchain Simulation
 * 
 * This file simulates a simple blockchain.
 * This is only for demonstration purposes and not intended for production use.
 */

const Block = require('./Block');
const Transaction = require('./Transaction');

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 1; // Reward for mining a block
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    // Create a new block with all pending transactions
    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    // Mine the block
    block.mineBlock(this.difficulty);

    // Add the mined block to the chain
    this.chain.push(block);

    // Reset pending transactions and add mining reward
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward, 'reward')
    ];
    
    return block;
  }

  createTransaction(transaction) {
    // Basic validation
    if (!transaction.isValid() && transaction.fromAddress !== null) {
      throw new Error('Invalid transaction');
    }

    this.pendingTransactions.push(transaction);
    return transaction;
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    // Loop through all blocks and transactions
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        // If the address is the sender, subtract the amount
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        // If the address is the recipient, add the amount
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    // Check pending transactions too
    for (const trans of this.pendingTransactions) {
      if (trans.fromAddress === address) {
        balance -= trans.amount;
      }

      if (trans.toAddress === address) {
        balance += trans.amount;
      }
    }

    return balance;
  }

  isChainValid() {
    // Check if the genesis block has been tampered with
    const genesisBlock = JSON.stringify(this.chain[0]);
    if (genesisBlock !== JSON.stringify(this.createGenesisBlock())) {
      return false;
    }

    // Check the remaining blocks on the chain
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify the hash of the current block
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // Verify that the current block points to the previous block's hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

module.exports = Blockchain; 