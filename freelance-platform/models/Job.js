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
  verifierFees: [{
    verifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fee: Number,
    paid: {
      type: Boolean,
      default: false
    }
  }],
  totalVerifierFees: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  refundProcessed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'expired'],
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
  paymentDetails: {
    amountDeducted: {
      type: Number,
      default: 0
    },
    deductedAt: Date,
    refundedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);