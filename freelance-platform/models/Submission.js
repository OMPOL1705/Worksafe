const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  verifications: [{
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved: {
      type: Boolean,
      default: false
    },
    comments: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);