import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingSubmissions: 0,
    balance: user?.balance || 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Different data for different roles
        if (user.role === 'job_provider') {
          const jobsRes = await axios.get('/api/jobs?provider=' + user._id);
          setStats(prev => ({
            ...prev,
            activeJobs: jobsRes.data.filter(job => job.status !== 'completed').length
          }));
        } else if (user.role === 'freelancer') {
          const jobsRes = await axios.get('/api/jobs/freelancer/assigned');
          setStats(prev => ({
            ...prev,
            activeJobs: jobsRes.data.length
          }));
        } else if (user.role === 'verifier') {
          const jobsRes = await axios.get('/api/jobs/verifier/assigned');
          
          // Get pending submissions
          let pendingCount = 0;
          for (const job of jobsRes.data) {
            const submissionsRes = await axios.get(`/api/submissions/job/${job._id}`);
            const pendingSubmissions = submissionsRes.data.filter(sub => {
              const myVerification = sub.verifications.find(v => v.verifier._id === user._id);
              return myVerification && !myVerification.approved;
            });
            pendingCount += pendingSubmissions.length;
          }
          
          setStats(prev => ({
            ...prev,
            activeJobs: jobsRes.data.length,
            pendingSubmissions: pendingCount
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  if (!user) return null;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}!</h2>
        <p className="text-gray-600">You are logged in as a {user.role.replace('_', ' ')}.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Balance</h3>
          <p className="text-3xl font-bold text-green-600">${stats.balance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.activeJobs}</p>
        </div>
        
        {user.role === 'verifier' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Pending Verifications</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingSubmissions}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {user.role === 'job_provider' && (
            <>
              <Link to="/create-job" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Post a New Job
              </Link>
              <Link to="/my-jobs" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Manage My Jobs
              </Link>
            </>
          )}
          
          {user.role === 'freelancer' && (
            <>
              <Link to="/jobs" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Find Jobs
              </Link>
              <Link to="/my-projects" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                My Projects
              </Link>
            </>
          )}
          
          {user.role === 'verifier' && (
            <Link to="/verify-submissions" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Verify Submissions
            </Link>
          )}
          
          <Link to="/profile" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;