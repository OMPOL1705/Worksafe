/**
 * Blockchain Wallet Simulation
 * 
 * This file simulates a wallet for blockchain transactions.
 * This is only for demonstration purposes and not intended for production use.
 */

const crypto = require('crypto');
const Transaction = require('./Transaction');

class Wallet {
  constructor(blockchain, userId) {
    this.blockchain = blockchain;
    this.userId = userId;
    this.privateKey = this.generatePrivateKey();
    this.publicKey = this.generatePublicKey();
  }

  generatePrivateKey() {
    // In a real system, this would use proper cryptographic key generation
    // This is simplified for demo purposes
    return crypto.createHash('sha256').update(this.userId + Date.now()).digest('hex');
  }

  generatePublicKey() {
    // In a real system, this would derive a public key from private key
    // This is simplified for demo purposes
    return crypto.createHash('sha256').update(this.privateKey + 'public').digest('hex');
  }

  getBalance() {
    return this.blockchain.getBalanceOfAddress(this.userId);
  }

  sendFunds(recipient, amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (this.getBalance() < amount) {
      throw new Error('Not enough funds');
    }

    const transaction = new Transaction(this.userId, recipient, amount);
    transaction.signTransaction(this.privateKey);
    
    this.blockchain.createTransaction(transaction);
    return transaction;
  }

  getTransactions() {
    const transactions = [];
    
    // Get transactions from blockchain
    for (const block of this.blockchain.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === this.userId || tx.toAddress === this.userId) {
          transactions.push(tx);
        }
      }
    }
    
    // Get pending transactions
    for (const tx of this.blockchain.pendingTransactions) {
      if (tx.fromAddress === this.userId || tx.toAddress === this.userId) {
        transactions.push(tx);
      }
    }
    
    return transactions;
  }
}

module.exports = Wallet; 