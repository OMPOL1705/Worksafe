const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // Properly destructure the middleware
const JobChatMessage = require('../models/JobChat');
const Job = require('../models/Job');

// @route   GET /api/chat/job/:jobId
// @desc    Get all chat messages for a job
// @access  Private
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    
    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Check if user is authorized to view messages
    const isJobProvider = job.jobProvider.toString() === req.user.id;
    const isSelectedFreelancer = job.selectedFreelancer && job.selectedFreelancer.toString() === req.user.id;
    const isVerifier = job.verifiers.some(v => v.toString() === req.user.id);
    
    if (!isJobProvider && !isSelectedFreelancer && !isVerifier) {
      return res.status(403).json({ msg: 'Not authorized to view these messages' });
    }
    
    // Fetch messages for this job
    const messages = await JobChatMessage.find({ jobId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
    
    // Format messages
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        role: msg.sender.role
      },
      text: msg.text,
      isSystemMessage: msg.isSystemMessage,
      timestamp: msg.createdAt
    }));
    
    res.json(formattedMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/messages
// @desc    Send a new message
// @access  Private
router.post('/messages', protect, async (req, res) => {
  const { jobId, text } = req.body;
  
  if (!text || !jobId) {
    return res.status(400).json({ msg: 'Job ID and message text are required' });
  }
  
  try {
    // Verify job exists
    const job = await Job.findById(jobId)
      .populate('jobProvider', 'name')
      .populate('selectedFreelancer', 'name');
    
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Check if user is authorized to send messages
    const isJobProvider = job.jobProvider._id.toString() === req.user.id;
    const isSelectedFreelancer = job.selectedFreelancer && job.selectedFreelancer._id.toString() === req.user.id;
    const isVerifier = job.verifiers.some(v => v.toString() === req.user.id);
    
    if (!isJobProvider && !isSelectedFreelancer && !isVerifier) {
      return res.status(403).json({ msg: 'Not authorized to send messages in this job' });
    }
    
    // Prevent messaging in open jobs (no selected freelancer)
    if (job.status === 'open') {
      return res.status(400).json({ msg: 'Cannot send messages for jobs without a selected freelancer' });
    }
    
    // Create new message
    const newMessage = new JobChatMessage({
      jobId,
      sender: req.user.id,
      text
    });
    
    const message = await newMessage.save();
    
    // Populate sender info for response (updated for newer Mongoose versions)
    const populatedMessage = await JobChatMessage.findById(message._id).populate('sender', 'name role');
    
    res.json({
      _id: populatedMessage._id,
      sender: {
        _id: populatedMessage.sender._id,
        name: populatedMessage.sender.name,
        role: populatedMessage.sender.role
      },
      text: populatedMessage.text,
      isSystemMessage: populatedMessage.isSystemMessage,
      timestamp: populatedMessage.createdAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/chat/system-message
// @desc    Add a system message
// @access  Private (Admin only in a real app)
router.post('/system-message', protect, async (req, res) => {
  const { jobId, text } = req.body;
  
  if (!text || !jobId) {
    return res.status(400).json({ msg: 'Job ID and message text are required' });
  }
  
  try {
    // In a real app, check admin status here
    
    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    
    // Create new system message
    const newMessage = new JobChatMessage({
      jobId,
      sender: req.user.id, // In a real app, this would be a system user ID
      text,
      isSystemMessage: true
    });
    
    const message = await newMessage.save();
    
    // Populate sender info for response (updated for newer Mongoose versions)
    const populatedMessage = await JobChatMessage.findById(message._id).populate('sender', 'name role');
    
    res.json({
      _id: populatedMessage._id,
      sender: {
        _id: populatedMessage.sender._id,
        name: "System",
        role: "system"
      },
      text: populatedMessage.text,
      isSystemMessage: true,
      timestamp: populatedMessage.createdAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 