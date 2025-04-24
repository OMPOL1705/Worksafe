/**
 * Blockchain Chat Simulation
 * 
 * This file simulates a chat system integrated with blockchain for verification.
 * This is only for demonstration purposes and not intended for production use.
 */

const crypto = require('crypto');

class ChatMessage {
  constructor(sender, recipient, content, jobId = null) {
    this.sender = sender;
    this.recipient = recipient;
    this.content = content;
    this.jobId = jobId;
    this.timestamp = Date.now();
    this.signature = '';
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(
        this.sender +
        (this.recipient || 'public') +
        this.content +
        this.timestamp.toString()
      )
      .digest('hex');
  }

  signMessage(privateKey) {
    // This is a simplified signing mechanism for demo purposes
    // In a real blockchain, you would use proper digital signatures
    const signature = crypto
      .createHmac('sha256', privateKey)
      .update(this.hash)
      .digest('hex');
    
    this.signature = signature;
    return this;
  }

  verifySignature(publicKey) {
    // In a real system, this would verify the signature with the public key
    // This is simplified for demo purposes
    return this.signature.length > 0;
  }
}

class BlockchainChat {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.messages = [];
    this.jobChats = {}; // Organize chats by jobId
  }

  sendMessage(sender, recipient, content, privateKey, jobId = null) {
    const message = new ChatMessage(sender, recipient, content, jobId);
    message.signMessage(privateKey);
    this.messages.push(message);
    
    // Organize by job if applicable
    if (jobId) {
      if (!this.jobChats[jobId]) {
        this.jobChats[jobId] = [];
      }
      this.jobChats[jobId].push(message);
    }
    
    return message;
  }

  getMessagesForUser(userId) {
    return this.messages.filter(msg => 
      msg.recipient === userId || msg.sender === userId || msg.recipient === 'public'
    );
  }

  getMessagesForJob(jobId) {
    return this.jobChats[jobId] || [];
  }

  getConversation(user1, user2) {
    return this.messages.filter(msg => 
      (msg.sender === user1 && msg.recipient === user2) ||
      (msg.sender === user2 && msg.recipient === user1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Verify all messages for integrity
  verifyMessageIntegrity() {
    for (const message of this.messages) {
      const originalHash = message.hash;
      const calculatedHash = message.calculateHash();
      
      if (originalHash !== calculatedHash) {
        return false; // Message has been tampered with
      }
    }
    return true;
  }
}

module.exports = { BlockchainChat, ChatMessage }; 