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
  
  const filteredJobs = jobs.filter(applyFilters);
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="keyword">
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Search jobs..."
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="minBudget">
              Min Budget ($)
            </label>
            <input
              type="number"
              id="minBudget"
              value={filters.minBudget}
              onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Min budget..."
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="maxBudget">
              Max Budget ($)
            </label>
            <input
              type="number"
              id="maxBudget"
              value={filters.maxBudget}
              onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Max budget..."
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-gray-700 mb-2">
            Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkillFilter(skill)}
                className={`px-3 py-1 rounded text-sm ${
                  filters.skills.includes(skill)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <>
          {filteredJobs.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600">No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map(job => (
                <div key={job._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                      <p className="text-sm text-gray-500 mb-1">
                        Posted by: {job.jobProvider.name}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        Status: <span className="font-medium capitalize">{job.status}</span>
                      </p>
                    </div>
                    <div className="text-xl font-bold text-green-600">${job.budget.toFixed(2)}</div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h3>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.map(skill => (
                        <span 
                          key={skill} 
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {job.applicants.length} applicant(s)
                    </p>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobListPage;