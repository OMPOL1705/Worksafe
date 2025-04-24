/**
 * Blockchain Simulation Runner
 * 
 * This file demonstrates the usage of the blockchain simulation.
 * Run with: node blockchain/simulation.js
 */

const Blockchain = require('./Blockchain');
const Transaction = require('./Transaction');
const Wallet = require('./Wallet');
const SmartContract = require('./SmartContract');
const { BlockchainChat } = require('./BlockchainChat');

// Initialize blockchain
const workSafeChain = new Blockchain();
console.log('🔗 WorkSafe Blockchain initialized');

// Create some users
const jobProvider = 'user123';
const freelancer = 'user456';
const verifier1 = 'verifier1';
const verifier2 = 'verifier2';

// Create wallets
const jobProviderWallet = new Wallet(workSafeChain, jobProvider);
const freelancerWallet = new Wallet(workSafeChain, freelancer);
const verifier1Wallet = new Wallet(workSafeChain, verifier1);
const verifier2Wallet = new Wallet(workSafeChain, verifier2);

// Initialize chat
const chat = new BlockchainChat(workSafeChain);

// Simulate mining to create initial coins
console.log('⛏️ Mining initial block...');
workSafeChain.minePendingTransactions('admin');

// Add initial balance to job provider (simulating a deposit)
const depositTx = new Transaction(null, jobProvider, 1000, 'deposit');
workSafeChain.createTransaction(depositTx);
console.log('💰 Added 1000 tokens to job provider wallet');

// Mine the block with the initial transaction
console.log('⛏️ Mining block with deposit transaction...');
workSafeChain.minePendingTransactions('admin');

// Check balances
console.log(`💼 Job Provider Balance: ${jobProviderWallet.getBalance()}`);
console.log(`💼 Freelancer Balance: ${freelancerWallet.getBalance()}`);

// Create a job and smart contract
const jobId = 'job123';
const jobBudget = 500;
const platformFee = jobBudget * 0.05; // 5%
const escrowAmount = jobBudget - platformFee;

console.log(`📝 Creating smart contract for job ${jobId} with budget ${jobBudget}`);
const contract = new SmartContract(workSafeChain, jobId, jobProvider, escrowAmount, platformFee);
console.log(`🔒 Contract created with address: ${contract.contractAddress}`);

// Fund the contract
console.log('💸 Funding the contract...');
contract.fund();

// Mine the funding transactions
console.log('⛏️ Mining block with funding transactions...');
workSafeChain.minePendingTransactions('admin');

// Check balances after funding
console.log(`💼 Job Provider Balance after funding: ${jobProviderWallet.getBalance()}`);

// Assign freelancer
console.log(`👨‍💻 Assigning freelancer ${freelancer} to the contract...`);
contract.assignFreelancer(freelancer);

// Add verifiers
console.log('👀 Adding verifiers to the contract...');
contract.addVerifier(verifier1);
contract.addVerifier(verifier2);
console.log(`✅ Verifiers added: ${contract.verifiers.join(', ')}`);
console.log(`✅ Verification threshold: ${contract.verificationThreshold}`);

// Simulate chat
console.log('\n📱 Starting chat simulation:');
chat.sendMessage(jobProvider, freelancer, 'Hi, I need you to start working on the project.', jobProviderWallet.privateKey, jobId);
chat.sendMessage(freelancer, jobProvider, 'Sure, I will start right away.', freelancerWallet.privateKey, jobId);
chat.sendMessage(freelancer, verifier1, 'I have a question about the verification process.', freelancerWallet.privateKey, jobId);
chat.sendMessage(verifier1, freelancer, 'What would you like to know?', verifier1Wallet.privateKey, jobId);

// Get job chat
const jobChat = chat.getMessagesForJob(jobId);
console.log(`📨 Chat messages for job ${jobId}:`);
jobChat.forEach(msg => {
  console.log(`[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.sender} → ${msg.recipient}: ${msg.content}`);
});

// Verify work
console.log('\n✍️ Verifiers approving work:');
console.log('Verifier 1 approving...');
contract.addVerifierApproval(verifier1, true, 'Good work!');
console.log('Verification approvals:', contract.verificationApprovals.length);

// Check if threshold met
const approvedCount = contract.verificationApprovals.filter(a => a.approved).length;
console.log(`Approved: ${approvedCount}/${contract.verificationThreshold} required`);

// Add second verifier (this will trigger payment release since threshold is met)
console.log('Verifier 2 approving...');
const verifyResult = contract.addVerifierApproval(verifier2, true, 'I approve this work as well');
console.log('Payment released:', verifyResult.paymentReleased);

// Mine the transaction block
console.log('⛏️ Mining block with release payment transaction...');
workSafeChain.minePendingTransactions('admin');

// Check final balances
console.log(`\n💼 FINAL BALANCES:`);
console.log(`Job Provider: ${jobProviderWallet.getBalance()}`);
console.log(`Freelancer: ${freelancerWallet.getBalance()}`);
console.log(`Contract Status: ${contract.status}`);

// Verify blockchain integrity
console.log(`\n🔍 Blockchain valid: ${workSafeChain.isChainValid()}`);
console.log(`🔍 Chat messages integrity: ${chat.verifyMessageIntegrity()}`);

console.log('\n✅ Simulation completed successfully!'); 