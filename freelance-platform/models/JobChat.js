const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobChatMessageSchema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  // For system messages
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to quickly find messages for a job
JobChatMessageSchema.index({ jobId: 1, createdAt: 1 });

module.exports = mongoose.model('JobChatMessage', JobChatMessageSchema); 