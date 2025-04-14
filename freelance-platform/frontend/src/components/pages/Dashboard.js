import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingSubmissions: 0,
    balance: user?.balance || 0,
    completedJobs: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Different data for different roles
        if (user.role === 'job_provider') {
          const jobsRes = await axios.get('/api/jobs?provider=' + user._id);
          const activeJobs = jobsRes.data.filter(job => job.status !== 'completed').length;
          const completedJobs = jobsRes.data.filter(job => job.status === 'completed').length;
          
          setStats(prev => ({
            ...prev,
            activeJobs,
            completedJobs
          }));
        } else if (user.role === 'freelancer') {
          const jobsRes = await axios.get('/api/jobs/freelancer/assigned');
          const activeJobs = jobsRes.data.filter(job => job.status !== 'completed').length;
          const completedJobs = jobsRes.data.filter(job => job.status === 'completed').length;
          
          setStats(prev => ({
            ...prev,
            activeJobs,
            completedJobs
          }));
        } else if (user.role === 'verifier') {
          const jobsRes = await axios.get('/api/jobs/verifier/assigned');
          
          // Get pending submissions
          let pendingCount = 0;
          let completedCount = 0;
          
          for (const job of jobsRes.data) {
            const submissionsRes = await axios.get(`/api/submissions/job/${job._id}`);
            const pendingSubmissions = submissionsRes.data.filter(sub => {
              const myVerification = sub.verifications.find(v => v.verifier._id === user._id);
              return myVerification && !myVerification.approved;
            });
            
            const completedSubmissions = submissionsRes.data.filter(sub => {
              const myVerification = sub.verifications.find(v => v.verifier._id === user._id);
              return myVerification && myVerification.approved;
            });
            
            pendingCount += pendingSubmissions.length;
            completedCount += completedSubmissions.length;
          }
          
          setStats(prev => ({
            ...prev,
            activeJobs: jobsRes.data.length,
            pendingSubmissions: pendingCount,
            completedJobs: completedCount
          }));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-6 shadow-lg">
        <div className="flex items-center">
          <div>
            <h2 className="text-2xl font-bold">{getGreeting()}, {user.name}!</h2>
            <p className="mt-1 opacity-90">Welcome to your {user.role.replace('_', ' ')} dashboard</p>
          </div>
          <div className="ml-auto bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <p className="text-sm opacity-80">Current Balance</p>
            <p className="text-2xl font-bold">${stats.balance.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Active Jobs</h3>
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <div className="animate-pulse h-10 w-16 bg-gray-200 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-600">{stats.activeJobs}</p>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t">
            <Link to={user.role === 'job_provider' ? "/my-jobs" : (user.role === 'freelancer' ? "/my-projects" : "/verify-submissions")} 
              className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center">
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Completed Jobs</h3>
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {loading ? (
              <div className="animate-pulse h-10 w-16 bg-gray-200 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600">{stats.completedJobs}</p>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t">
            <Link to={user.role === 'job_provider' ? "/my-jobs" : (user.role === 'freelancer' ? "/my-projects" : "/verify-submissions")} 
              className="text-green-600 text-sm font-medium hover:text-green-800 flex items-center">
              View History
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        {user.role === 'verifier' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Pending Verifications</h3>
                <div className="bg-orange-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              {loading ? (
                <div className="animate-pulse h-10 w-16 bg-gray-200 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-orange-600">{stats.pendingSubmissions}</p>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t">
              <Link to="/verify-submissions" className="text-orange-600 text-sm font-medium hover:text-orange-800 flex items-center">
                View Submissions
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Profile Completion</h3>
                <div className="bg-purple-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                  <div style={{ width: user.skills && user.skills.length > 0 ? "100%" : "60%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                </div>
                <p className="text-sm text-gray-600">
                  {user.skills && user.skills.length > 0 ? "Profile complete" : "Add skills to complete your profile"}
                </p>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t">
              <Link to="/profile" className="text-purple-600 text-sm font-medium hover:text-purple-800 flex items-center">
                Update Profile
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.role === 'job_provider' && (
              <>
                <Link to="/create-job" className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">Post a New Job</h3>
                    <p className="text-sm text-gray-600">Create a job listing for freelancers</p>
                  </div>
                </Link>
                
                <Link to="/my-jobs" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-200 transition-colors">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">Manage Jobs</h3>
                    <p className="text-sm text-gray-600">View and manage your posted jobs</p>
                  </div>
                </Link>
              </>
            )}
            
            {user.role === 'freelancer' && (
              <>
                <Link to="/jobs" className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">Find Jobs</h3>
                    <p className="text-sm text-gray-600">Browse available job listings</p>
                  </div>
                </Link>
                
                <Link to="/my-projects" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-200 transition-colors">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">My Projects</h3>
                    <p className="text-sm text-gray-600">View your assigned projects</p>
                  </div>
                </Link>
              </>
            )}
            
            {user.role === 'verifier' && (
              <Link to="/verify-submissions" className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group">
                <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-800">Verify Submissions</h3>
                  <p className="text-sm text-gray-600">Review and approve work submissions</p>
                </div>
              </Link>
            )}
            
            <Link to="/profile" className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors group">
              <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-800">Update Profile</h3>
                <p className="text-sm text-gray-600">Edit your profile information</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;