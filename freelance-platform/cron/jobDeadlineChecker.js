const cron = require('node-cron');
const Job = require('../models/Job');
const User = require('../models/User');

// Function to check for expired jobs and process refunds
const checkExpiredJobs = async () => {
  console.log('Checking for expired jobs...');
  const now = new Date();
  
  try {
    // Find jobs that have passed their deadline, are not completed, and haven't been refunded yet
    const expiredJobs = await Job.find({
      deadline: { $lt: now },
      status: { $in: ['assigned', 'in_progress'] },
      refundProcessed: false
    }).populate('jobProvider');
    
    console.log(`Found ${expiredJobs.length} expired jobs`);
    
    for (const job of expiredJobs) {
      console.log(`Processing refund for job: ${job._id} (${job.title})`);
      
      // Get job provider
      const jobProvider = await User.findById(job.jobProvider);
      
      if (jobProvider) {
        // Refund the job provider
        const refundAmount = job.paymentDetails.amountDeducted;
        jobProvider.balance += refundAmount;
        await jobProvider.save();
        
        // Update job status
        job.status = 'expired';
        job.refundProcessed = true;
        job.paymentDetails.refundedAt = Date.now();
        await job.save();
        
        console.log(`Refunded ${refundAmount} to ${jobProvider.name} for expired job ${job._id}`);
      }
    }
  } catch (error) {
    console.error('Error processing expired jobs:', error);
  }
};

// Schedule the job to run every hour
const scheduleJobChecker = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await checkExpiredJobs();
  });
  
  console.log('Job deadline checker scheduled');
};

module.exports = { scheduleJobChecker, checkExpiredJobs }; 