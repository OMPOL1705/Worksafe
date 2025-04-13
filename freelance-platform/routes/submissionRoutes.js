const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Create a submission
router.post('/', protect, authorize('freelancer'), async (req, res) => {
  try {
    const { jobId, text, images } = req.body;
    
    // Verify the job exists and freelancer is assigned
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.selectedFreelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Create submission with verification entries for each verifier
    const verificationEntries = job.verifiers.map(verifier => ({
      verifier,
      approved: false
    }));
    
    const submission = await Submission.create({
      job: jobId,
      freelancer: req.user.id,
      text,
      images: images || [],
      verifications: verificationEntries
    });
    
    // Update job status to in_progress
    job.status = 'in_progress';
    await job.save();
    
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get submissions for a job
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is authorized (job provider, assigned freelancer, or verifier)
    const isAuthorized = 
      job.jobProvider.toString() === req.user.id ||
      (job.selectedFreelancer && job.selectedFreelancer.toString() === req.user.id) ||
      job.verifiers.some(v => v.toString() === req.user.id);
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const submissions = await Submission.find({ job: jobId })
      .populate('freelancer', 'name email')
      .populate('verifications.verifier', 'name email');
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all submissions for verifier
router.get('/job', protect, async (req, res) => {
  try {
    // Get all jobs where this user is involved (as provider, freelancer, or verifier)
    const jobs = await Job.find({
      $or: [
        { jobProvider: req.user.id },
        { selectedFreelancer: req.user.id },
        { verifiers: req.user.id }
      ]
    });
    
    const jobIds = jobs.map(job => job._id);
    
    // Get all submissions for these jobs
    const submissions = await Submission.find({ job: { $in: jobIds } })
      .populate('freelancer', 'name email')
      .populate('verifications.verifier', 'name email')
      .populate('job');
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Verify a submission
router.put('/:id/verify', protect, authorize('verifier'), async (req, res) => {
  try {
    const { approved, comments } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Find this verifier's verification entry
    const verificationIndex = submission.verifications.findIndex(
      v => v.verifier.toString() === req.user.id
    );
    
    if (verificationIndex === -1) {
      return res.status(403).json({ message: 'Not authorized to verify this submission' });
    }
    
    // Update verification
    submission.verifications[verificationIndex].approved = approved;
    submission.verifications[verificationIndex].comments = comments;
    submission.verifications[verificationIndex].updatedAt = Date.now();
    
    // Check if all verifiers have approved
    const allApproved = submission.verifications.every(v => v.approved);
    
    if (allApproved) {
      submission.status = 'approved';
      
      // Update job status and transfer payment
      const job = await Job.findById(submission.job);
      job.status = 'completed';
      
      // Find the freelancer and add payment
      const freelancer = await User.findById(submission.freelancer);
      
      // Find the price from the application
      const application = job.applicants.find(
        app => app.freelancer.toString() === freelancer._id.toString()
      );
      
      if (application) {
        freelancer.balance += application.price;
        await freelancer.save();
      }
      
      await job.save();
    }
    
    await submission.save();
    
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;