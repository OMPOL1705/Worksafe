import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const CreateJobPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    requiredSkills: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { title, description, budget, requiredSkills } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    // Simple validation
    if (!title || !description || !budget) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Parse skills into array
      const skillsArray = requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);
      
      const res = await axios.post('/api/jobs', {
        title,
        description,
        budget: parseFloat(budget),
        requiredSkills: skillsArray
      });
      
      setLoading(false);
      navigate(`/jobs/${res.data._id}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Error creating job');
      console.error(err);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Post a New Job</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="title">
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
            placeholder="e.g. Website Development, Logo Design, etc."
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Job Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            rows="6"
            required
            placeholder="Provide detailed information about the job, requirements, timeline, etc."
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="budget">
            Budget ($) *
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={budget}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
            min="1"
            placeholder="Enter your budget"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="requiredSkills">
            Required Skills (comma separated)
          </label>
          <input
            type="text"
            id="requiredSkills"
            name="requiredSkills"
            value={requiredSkills}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="e.g. React, Node.js, UI/UX Design, etc."
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 focus:outline-none"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPage;