import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const JobListPage = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    minBudget: '',
    maxBudget: '',
    skills: []
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [expandedFilterSection, setExpandedFilterSection] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/jobs');
        
        // Only show open jobs if freelancer
        const filteredJobs = user?.role === 'freelancer' 
          ? res.data.filter(job => job.status === 'open')
          : res.data;
        
        setJobs(filteredJobs);
        
        // Collect all skills from jobs
        const allSkills = new Set();
        filteredJobs.forEach(job => {
          job.requiredSkills.forEach(skill => allSkills.add(skill));
        });
        
        setAvailableSkills(Array.from(allSkills));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [user]);
  
  const toggleSkillFilter = (skill) => {
    if (filters.skills.includes(skill)) {
      setFilters({
        ...filters,
        skills: filters.skills.filter(s => s !== skill)
      });
    } else {
      setFilters({
        ...filters,
        skills: [...filters.skills, skill]
      });
    }
  };
  
  const clearFilters = () => {
    setFilters({
      keyword: '',
      minBudget: '',
      maxBudget: '',
      skills: []
    });
    setSortBy('newest');
  };
  
  const applyFilters = (job) => {
    // Keyword filter
    if (filters.keyword && !job.title.toLowerCase().includes(filters.keyword.toLowerCase()) && 
        !job.description.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    
    // Budget filters
    if (filters.minBudget && job.budget < parseInt(filters.minBudget)) {
      return false;
    }
    
    if (filters.maxBudget && job.budget > parseInt(filters.maxBudget)) {
      return false;
    }
    
    // Skills filter
    if (filters.skills.length > 0) {
      const hasMatchingSkill = filters.skills.some(skill => 
        job.requiredSkills.includes(skill)
      );
      
      if (!hasMatchingSkill) {
        return false;
      }
    }
    
    return true;
  };
  
  // Get all filtered jobs
  let filteredJobs = jobs.filter(applyFilters);
  
  // Apply sorting
  filteredJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'budget_high') {
      return b.budget - a.budget;
    } else if (sortBy === 'budget_low') {
      return a.budget - b.budget;
    } else if (sortBy === 'applicants') {
      return b.applicants.length - a.applicants.length;
    }
    return 0;
  });
  
  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Jobs</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 pl-4 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
              <option value="applicants">Most Applicants</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          
          <button
            onClick={() => setExpandedFilterSection(!expandedFilterSection)}
            className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-gray-600"
            aria-label="Toggle filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
            {/* Expanded Filters */}
            {expandedFilterSection && (
              <div className="p-4 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {(filters.keyword || filters.minBudget || filters.maxBudget || filters.skills.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="keyword">
              Keyword
            </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </div>
            <input
              type="text"
              id="keyword"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search jobs..."
            />
                    </div>
          </div>
          
          <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="minBudget">
                      Budget Range
            </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
            <input
              type="number"
              id="minBudget"
              value={filters.minBudget}
              onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                          className="w-full pl-7 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Min"
            />
          </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
            <input
              type="number"
              id="maxBudget"
              value={filters.maxBudget}
              onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                          className="w-full pl-7 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Max"
            />
                      </div>
          </div>
        </div>
        
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
                    <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                      {availableSkills.length === 0 ? (
                        <p className="text-sm text-gray-500">No skills available</p>
                      ) : (
          <div className="flex flex-wrap gap-2">
            {availableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkillFilter(skill)}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filters.skills.includes(skill)
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {skill}
                              {filters.skills.includes(skill) && (
                                <span className="ml-1 font-bold">×</span>
                              )}
              </button>
            ))}
          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
      
        {/* Main content - Job listings */}
        <div className="lg:col-span-3">
      {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-4 text-gray-600">Loading available jobs...</p>
              </div>
            </div>
      ) : (
        <>
              {/* Results count */}
              <div className="text-sm text-gray-500 mb-4">
                Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                {filters.keyword && <span> matching "{filters.keyword}"</span>}
              </div>
              
          {filteredJobs.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching jobs found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search filters to find more results.</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear all filters
                  </button>
            </div>
          ) : (
                <div className="space-y-6">
              {filteredJobs.map(job => (
                    <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1 hover:text-blue-600">
                              <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                {job.jobProvider.name}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                    </div>
                          <div className="text-right">
                    <div className="text-xl font-bold text-green-600">${job.budget.toFixed(2)}</div>
                            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                              job.status === 'open' ? 'bg-blue-100 text-blue-800' :
                              job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                              job.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                              job.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          </div>
                  </div>
                  
                        <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                        
                        <div className="flex flex-wrap items-center justify-between">
                          <div className="flex flex-wrap gap-1 mb-2 md:mb-0">
                            {job.requiredSkills.slice(0, 3).map(skill => (
                        <span 
                          key={skill} 
                                className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                            {job.requiredSkills.length > 3 && (
                              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{job.requiredSkills.length - 3} more
                              </span>
                            )}
                    </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-5 h-5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                              </svg>
                              {job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}
                  </div>
                  
                    <Link
                      to={`/jobs/${job._id}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                    </Link>
                          </div>
                        </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
};

export default JobListPage;