const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, skills } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      skills: skills || [],
      balance: role === 'job_provider' ? 1000 : 0 // Give job providers some initial balance
    });
    
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      balance: user.balance,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      skills: user.skills,
      balance: user.balance,
      portfolio: user.portfolio,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, portfolio, skills } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.name = name || user.name;
      user.portfolio = portfolio || user.portfolio;
      user.skills = skills || user.skills;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        skills: updatedUser.skills,
        balance: updatedUser.balance,
        portfolio: updatedUser.portfolio,
        token: req.headers.authorization.split(' ')[1]
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all verifiers
router.get('/verifiers', protect, authorize('job_provider'), async (req, res) => {
  try {
    const verifiers = await User.find({ role: 'verifier' }).select('-password');
    res.json(verifiers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;