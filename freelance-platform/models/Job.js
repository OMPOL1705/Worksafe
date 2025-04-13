const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  jobProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedFreelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed'],
    default: 'open'
  },
  applicants: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: Number,
    proposal: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);