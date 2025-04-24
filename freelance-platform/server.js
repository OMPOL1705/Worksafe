const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
// Add this with your other route imports
const jobChat = require('./routes/jobChat');
// Import our job deadline checker
const { scheduleJobChecker } = require('./cron/jobDeadlineChecker');



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    // Schedule the job deadline checker
    scheduleJobChecker();
  })
  .catch(err => console.log('MongoDB Connection Error: ', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/chat', jobChat);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('frontend/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});