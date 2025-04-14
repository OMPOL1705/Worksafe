import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const MyJobsPage = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');

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
  
  // Filter jobs based on active tab and search term
  const filteredJobs = jobs.filter(job => {
    const matchesTab = activeTab === 'all' || job.status === activeTab;
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });
  
  // Sort jobs based on selected option
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'budget_high':
        return b.budget - a.budget;
      case 'budget_low':
        return a.budget - b.budget;
      case 'applicants':
        return (b.applicants?.length || 0) - (a.applicants?.length || 0);
      default:
        return 0;
    }
  });
  
  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get appropriate title based on user role
  const getPageTitle = () => {
    switch (user?.role) {
      case 'job_provider':
        return 'My Posted Jobs';
      case 'freelancer':
        return 'My Assigned Projects';
      case 'verifier':
        return 'My Verification Tasks';
      default:
        return 'My Jobs';
    }
  };
  
  // Get status badge styles
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your jobs...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-red-50 py-4 px-6 border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">There was an error loading your jobs</h3>
                <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-white text-center">
          <button 
            onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            Try Again
          </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {getPageTitle()}
        </h1>
        
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {user.role === 'job_provider' 
                ? "You haven't created any jobs yet. Post your first job to find trusted freelancers." 
              : user.role === 'freelancer'
                  ? "You haven't been assigned to any jobs yet. Browse available jobs to apply."
                  : "You haven't been assigned as a verifier to any jobs yet. Check back later for verification tasks."}
          </p>
            
          {user.role === 'job_provider' && (
              <Link to="/create-job" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              Create a New Job
            </Link>
          )}
            
          {user.role === 'freelancer' && (
              <Link to="/jobs" className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              Browse Available Jobs
            </Link>
          )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getPageTitle()} <span className="text-lg font-normal text-gray-500 ml-2">({jobs.length})</span>
      </h1>
      
        {user.role === 'job_provider' && (
          <Link to="/create-job" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Post New Job
          </Link>
        )}
      </div>
      
      {/* Search and filter controls */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by title, description or skills..."
              />
            </div>
            
            <div className="flex">
              <div className="relative inline-block text-left">
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget_high">Budget: High to Low</option>
                  <option value="budget_low">Budget: Low to High</option>
                  {user.role === 'job_provider' && (
                    <option value="applicants">Most Applicants</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status filter tabs */}
        <div className="px-4 border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
              All Jobs
          </button>
          <button
            onClick={() => setActiveTab('open')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'assigned'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'in_progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('completed')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Completed
          </button>
        </nav>
        </div>
      </div>
      
      {/* Display filtered jobs */}
      {sortedJobs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matching jobs</h3>
          <p className="mt-1 text-sm text-gray-500">
            No jobs match your current filters. Try adjusting your search or filters.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {setActiveTab('all'); setSearchTerm('');}}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedJobs.map(job => (
            <div key={job._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors duration-200">
                    <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                  </h2>
                  <span className={`ml-2 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    getStatusBadgeClass(job.status)
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2 h-10">{job.description}</p>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map(skill => (
                      <span key={skill} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="inline-block px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100">
                        +{job.requiredSkills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                  <div>
                      <div className="flex items-center text-gray-500 mb-1">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(job.createdAt)}</span>
                  </div>
                      <div className="flex items-center text-gray-500">
                        <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        <span>
                      Applications: {job.applicants?.length || 0}
                    </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-green-600 flex items-center justify-end">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${job.budget}
                      </div>
                      {job.selectedFreelancer && (
                        <div className="flex items-center justify-end text-gray-500 mt-1">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate max-w-[120px]" title={job.selectedFreelancer.name}>
                            {job.selectedFreelancer.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-3 bg-gray-50 border-t">
                <Link 
                  to={`/jobs/${job._id}`} 
                  className="inline-block w-full py-2 px-4 text-center bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Job count summary */}
      {sortedJobs.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 flex items-center">
          <svg className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Showing {sortedJobs.length} {sortedJobs.length === 1 ? 'job' : 'jobs'} out of {jobs.length} total</span>
        </div>
      )}
    </div>
  );
};

export default MyJobsPage;