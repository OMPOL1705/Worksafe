import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const MyJobsPage = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'open', 'assigned', 'in_progress', 'completed'

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        let endpoint = '';
        
        // Determine endpoint based on user role
        if (user.role === 'job_provider') {
          endpoint = '/api/jobs/provider';
        } else if (user.role === 'freelancer') {
          endpoint = '/api/jobs/freelancer/assigned';
        } else if (user.role === 'verifier') {
          endpoint = '/api/jobs/verifier/assigned';
        } else {
          throw new Error('Invalid user role');
        }
        
        const response = await axios.get(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Jobs retrieved:', response.data);
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err.message || 'Failed to load jobs');
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [user]);
  
  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    return job.status === activeTab;
  });
  
  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading jobs...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">
          {user.role === 'job_provider' ? 'My Jobs' : 'My Projects'}
        </h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h2 className="text-xl font-semibold mt-4 mb-2">No Jobs Found</h2>
          <p className="text-gray-600 mb-6">
            {user.role === 'job_provider' 
              ? "You haven't created any jobs yet." 
              : user.role === 'freelancer'
                ? "You haven't been assigned to any jobs yet."
                : "You haven't been assigned as a verifier to any jobs yet."}
          </p>
          {user.role === 'job_provider' && (
            <Link to="/create-job" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
              Create a New Job
            </Link>
          )}
          {user.role === 'freelancer' && (
            <Link to="/jobs" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
              Browse Available Jobs
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">
        {user.role === 'job_provider' ? 'My Jobs' : 'My Projects'}
      </h1>
      
      {/* Tabs for filtering jobs */}
      <div className="mb-6 border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'assigned'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'in_progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed
          </button>
        </nav>
      </div>
      
      {/* Display filtered jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredJobs.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No jobs found for the selected filter.</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    job.status === 'open' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                    job.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {job.requiredSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <div>
                    <span className="block">Budget: <span className="font-semibold text-green-600">${job.budget}</span></span>
                    <span className="block">Created: {formatDate(job.createdAt)}</span>
                  </div>
                  
                  <div className="text-right">
                    {job.selectedFreelancer && (
                      <span className="block">
                        Freelancer: {job.selectedFreelancer.name}
                      </span>
                    )}
                    <span className="block">
                      Applications: {job.applicants?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-gray-50 border-t">
                <Link 
                  to={`/jobs/${job._id}`} 
                  className="inline-block w-full py-2 px-4 text-center bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      
      {user.role === 'job_provider' && (
        <div className="mt-8 text-center">
          <Link to="/create-job" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">
            Create a New Job
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyJobsPage;