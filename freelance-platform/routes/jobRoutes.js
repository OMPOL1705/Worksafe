const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Create a job
router.post('/', protect, authorize('job_provider'), async (req, res) => {
  try {
    const { title, description, budget, requiredSkills, deadline } = req.body;
    
    // Validate deadline is in the future
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        return res.status(400).json({ message: 'Deadline must be in the future' });
      }
    }
    
    const job = await Job.create({
      title,
      description,
      budget,
      requiredSkills,
      jobProvider: req.user.id,
      deadline: deadline ? new Date(deadline) : null
    });
    
    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate('jobProvider', 'name email')
      .populate('selectedFreelancer', 'name email')
      .populate('verifiers', 'name email')
      .populate('applicants.freelancer', 'name email skills');
    
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get jobs created by provider
router.get('/provider', protect, authorize('job_provider'), async (req, res) => {
  try {
    const jobs = await Job.find({ jobProvider: req.user.id })
      .populate('jobProvider', 'name email')
      .populate('selectedFreelancer', 'name email')
      .populate('verifiers', 'name email')
      .populate('applicants.freelancer', 'name email skills')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching provider jobs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get jobs by freelancer
router.get('/freelancer/assigned', protect, authorize('freelancer'), async (req, res) => {
  try {
    const jobs = await Job.find({ 
      selectedFreelancer: req.user.id,
      status: { $in: ['assigned', 'in_progress'] }
    })
      .populate('jobProvider', 'name email')
      .populate('verifiers', 'name email');
    
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get jobs to verify
router.get('/verifier/assigned', protect, authorize('verifier'), async (req, res) => {
  try {
    const jobs = await Job.find({ 
      verifiers: req.user.id,
      status: { $in: ['assigned', 'in_progress'] }
    })
      .populate('jobProvider', 'name email')
      .populate('selectedFreelancer', 'name email');
    
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('jobProvider', 'name email')
      .populate('selectedFreelancer', 'name email')
      .populate('verifiers', 'name email')
      .populate('applicants.freelancer', 'name email skills');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Apply for a job
router.post('/:id/apply', protect, authorize('freelancer'), async (req, res) => {
  try {
    const { price, proposal } = req.body;
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }
    
    // Check if already applied
    const alreadyApplied = job.applicants.find(
      applicant => applicant.freelancer.toString() === req.user.id
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    
    job.applicants.push({
      freelancer: req.user.id,
      price,
      proposal
    });
    
    await job.save();
    
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Select a freelancer
router.put('/:id/select-freelancer', protect, authorize('job_provider'), async (req, res) => {
  try {
    const { freelancerId, verifierIds } = req.body;
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.jobProvider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job already has a selected freelancer' });
    }
    
    // Check if freelancer is in applicants
    const application = job.applicants.find(
      app => app.freelancer.toString() === freelancerId
    );
    
    if (!application) {
      return res.status(400).json({ message: 'This freelancer has not applied for the job' });
    }
    
    // Check if verifiers are provided
    if (!verifierIds || verifierIds.length === 0) {
      return res.status(400).json({ message: 'At least one verifier is required' });
    }

    // Calculate verifier fees (10% of job amount per verifier)
    const verifierFeePercentage = 0.10;
    const verifierFeeTotal = application.price * verifierFeePercentage * verifierIds.length;
    
    // Calculate total amount to deduct (job price + verifier fees)
    const totalDeduction = application.price + verifierFeeTotal;
    
    // Check if job provider has enough balance
    const jobProvider = await User.findById(req.user.id);
    if (jobProvider.balance < totalDeduction) {
      return res.status(400).json({ 
        message: `Insufficient balance. You need ${totalDeduction} to cover the job cost and verifier fees.` 
      });
    }
    
    // Deduct total amount from job provider
    jobProvider.balance -= totalDeduction;
    await jobProvider.save();
    
    // Store verifier fee information in the job document
    job.verifierFees = verifierIds.map(verifierId => ({
      verifier: verifierId,
      fee: application.price * verifierFeePercentage,
      paid: false
    }));
    
    // Update job
    job.selectedFreelancer = freelancerId;
    job.verifiers = verifierIds;
    job.status = 'assigned';
    job.totalVerifierFees = verifierFeeTotal;
    
    // Record payment details
    job.paymentDetails = {
      amountDeducted: totalDeduction,
      deductedAt: Date.now()
    };
    
    await job.save();
    
    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Check for expired jobs (admin only)
router.post('/check-expired', protect, authorize('admin'), async (req, res) => {
  try {
    const { checkExpiredJobs } = require('../cron/jobDeadlineChecker');
    await checkExpiredJobs();
    res.json({ message: 'Expired jobs checked successfully' });
  } catch (error) {
    console.error('Error checking expired jobs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;