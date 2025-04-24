/**
 * Blockchain Transaction Simulation
 * 
 * This file simulates a transaction in a blockchain.
 * This is only for demonstration purposes and not intended for production use.
 */

const crypto = require('crypto');

class Transaction {
  constructor(fromAddress, toAddress, amount, type = 'transfer', jobId = null, contractAddress = null) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = '';
    this.jobId = jobId;
    this.contractAddress = contractAddress;
    this.type = type; // transfer, escrow, release, refund, platformFee, reward
    this.status = 'pending';
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(
        (this.fromAddress || '') +
        (this.toAddress || '') +
        this.amount +
        this.timestamp
      )
      .digest('hex');
  }

  signTransaction(privateKey) {
    // This is a simplified signing mechanism for demo purposes
    // In a real blockchain, you would use proper digital signatures
    if (this.fromAddress === null) {
      throw new Error('Cannot sign transactions with fromAddress as null');
    }
    
    const hashTx = this.calculateHash();
    const signature = crypto
      .createHmac('sha256', privateKey)
      .update(hashTx)
      .digest('hex');
    
    this.signature = signature;
    return this;
  }

  isValid() {
    // Mining rewards don't have a from address
    if (this.fromAddress === null) return true;
    
    // Basic validation
    if (!this.signature || this.signature.length === 0) {
      return false;
    }
    
    if (this.amount <= 0) {
      return false;
    }
    
    return true;
  }
}

module.exports = Transaction; 