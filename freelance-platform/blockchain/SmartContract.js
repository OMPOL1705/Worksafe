/**
 * Blockchain Smart Contract Simulation
 * 
 * This file simulates a smart contract for escrow payments.
 * This is only for demonstration purposes and not intended for production use.
 */

const crypto = require('crypto');
const Transaction = require('./Transaction');

class SmartContract {
  constructor(blockchain, jobId, jobProviderId, escrowAmount, platformFee) {
    this.blockchain = blockchain;
    this.contractAddress = this.generateContractAddress(jobId, jobProviderId);
    this.jobId = jobId;
    this.jobProvider = jobProviderId;
    this.freelancer = null;
    this.verifiers = [];
    this.escrowAmount = escrowAmount;
    this.platformFee = platformFee;
    this.status = 'created'; // created, funded, inProgress, completed, disputed, refunded, cancelled
    this.verificationRequired = true;
    this.verificationThreshold = 1;
    this.verificationApprovals = [];
    this.transactions = [];
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  generateContractAddress(jobId, jobProvider) {
    const timestamp = Date.now().toString();
    const data = `${jobId}-${jobProvider}-${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 42);
  }

  fund() {
    if (this.status !== 'created') {
      throw new Error(`Contract cannot be funded in ${this.status} status`);
    }

    // Check if job provider has enough balance
    const providerBalance = this.blockchain.getBalanceOfAddress(this.jobProvider);
    if (providerBalance < (this.escrowAmount + this.platformFee)) {
      throw new Error('Insufficient balance to fund contract');
    }

    // Create escrow transaction
    const escrowTransaction = new Transaction(
      this.jobProvider,
      null, // Escrow has no recipient yet
      this.escrowAmount,
      'escrow',
      this.jobId,
      this.contractAddress
    );

    // Create platform fee transaction
    const platformFeeTransaction = new Transaction(
      this.jobProvider,
      'platform', // Platform wallet address
      this.platformFee,
      'platformFee',
      this.jobId,
      this.contractAddress
    );

    // Add transactions to blockchain
    this.blockchain.createTransaction(escrowTransaction);
    this.blockchain.createTransaction(platformFeeTransaction);

    // Update contract
    this.status = 'funded';
    this.updatedAt = Date.now();
    this.transactions.push(escrowTransaction, platformFeeTransaction);

    return {
      contract: this,
      transactions: [escrowTransaction, platformFeeTransaction]
    };
  }

  assignFreelancer(freelancerId) {
    if (this.status !== 'funded') {
      throw new Error(`Contract cannot assign freelancer in ${this.status} status`);
    }

    this.freelancer = freelancerId;
    this.status = 'inProgress';
    this.updatedAt = Date.now();

    return this;
  }

  addVerifier(verifierId) {
    this.verifiers.push(verifierId);
    this.verificationThreshold = Math.ceil(this.verifiers.length / 2);
    this.updatedAt = Date.now();
    return this;
  }

  addVerifierApproval(verifierId, approved, comments = '') {
    if (this.status !== 'inProgress') {
      throw new Error(`Contract cannot be verified in ${this.status} status`);
    }

    // Check if verifier is assigned to this contract
    if (!this.verifiers.includes(verifierId)) {
      throw new Error('Only assigned verifiers can approve this contract');
    }

    // Check if verifier has already approved
    const existingApproval = this.verificationApprovals.find(
      a => a.verifier === verifierId
    );

    if (existingApproval) {
      throw new Error('You have already submitted your verification');
    }

    // Add verification
    this.verificationApprovals.push({
      verifier: verifierId,
      approved,
      comments,
      timestamp: Date.now()
    });

    // Check if we've reached the approval threshold
    const approvalCount = this.verificationApprovals.filter(a => a.approved).length;
    let paymentReleased = false;

    if (approvalCount >= this.verificationThreshold) {
      // Release payment to freelancer
      this.releasePayment();
      paymentReleased = true;
    }

    this.updatedAt = Date.now();

    return {
      contract: this,
      paymentReleased
    };
  }

  releasePayment() {
    if (this.status !== 'inProgress') {
      throw new Error(`Payment cannot be released in ${this.status} status`);
    }

    if (!this.freelancer) {
      throw new Error('No freelancer assigned to this contract');
    }

    // Create release transaction
    const releaseTransaction = new Transaction(
      null, // From escrow
      this.freelancer,
      this.escrowAmount,
      'release',
      this.jobId,
      this.contractAddress
    );

    // Add transaction to blockchain
    this.blockchain.createTransaction(releaseTransaction);

    // Update contract
    this.status = 'completed';
    this.updatedAt = Date.now();
    this.transactions.push(releaseTransaction);

    return {
      contract: this,
      transaction: releaseTransaction
    };
  }

  initiateDispute(initiatorId, reason) {
    if (this.status !== 'inProgress' && this.status !== 'funded') {
      throw new Error(`Dispute cannot be initiated in ${this.status} status`);
    }

    // Check if user is involved in this contract
    const isJobProvider = this.jobProvider === initiatorId;
    const isFreelancer = this.freelancer === initiatorId;
    const isVerifier = this.verifiers.includes(initiatorId);

    if (!isJobProvider && !isFreelancer && !isVerifier) {
      throw new Error('Only contract participants can initiate a dispute');
    }

    // Set dispute details
    this.status = 'disputed';
    this.disputeInitiator = initiatorId;
    this.disputeReason = reason;
    this.disputeStatus = 'pending';
    this.disputeTimestamp = Date.now();
    this.updatedAt = Date.now();

    return this;
  }

  resolveDispute(resolution) {
    if (this.status !== 'disputed') {
      throw new Error(`Dispute cannot be resolved in ${this.status} status`);
    }

    // Update dispute details
    this.disputeStatus = 'resolved';
    this.disputeResolution = resolution;
    this.updatedAt = Date.now();

    let transaction;

    if (resolution === 'freelancer') {
      // Release payment to freelancer
      transaction = new Transaction(
        null, // From escrow
        this.freelancer,
        this.escrowAmount,
        'release',
        this.jobId,
        this.contractAddress
      );

      this.status = 'completed';
    } else {
      // Refund to job provider
      transaction = new Transaction(
        null, // From escrow
        this.jobProvider,
        this.escrowAmount,
        'refund',
        this.jobId,
        this.contractAddress
      );

      this.status = 'refunded';
    }

    // Add transaction to blockchain
    this.blockchain.createTransaction(transaction);
    this.transactions.push(transaction);

    return {
      contract: this,
      transaction
    };
  }

  cancel() {
    if (this.status !== 'created' && this.status !== 'funded') {
      throw new Error(`Contract cannot be cancelled in ${this.status} status`);
    }

    let refundTransaction;

    if (this.status === 'funded') {
      // Refund to job provider
      refundTransaction = new Transaction(
        null, // From escrow
        this.jobProvider,
        this.escrowAmount,
        'refund',
        this.jobId,
        this.contractAddress
      );

      // Add transaction to blockchain
      this.blockchain.createTransaction(refundTransaction);
      this.transactions.push(refundTransaction);
    }

    // Update contract status
    this.status = 'cancelled';
    this.updatedAt = Date.now();

    return this;
  }
}

module.exports = SmartContract; 