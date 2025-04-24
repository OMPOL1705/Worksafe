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
    requiredSkills: '',
    deadline: '',
    category: 'web-development'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  
  const { title, description, budget, requiredSkills, deadline, category } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!title || !description || !budget || requiredSkills.length === 0 || !deadline) {
      setError('Please fill in all fields and add at least one required skill');
      return;
    }
    
    // Validate that deadline is in the future
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      setError('Deadline must be in the future');
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
        requiredSkills: skillsArray,
        deadline: deadline || undefined,
        category: category || 'other'
      });
      
      setLoading(false);
      navigate(`/jobs/${res.data._id}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Error creating job');
      console.error(err);
    }
  };

  const togglePreview = () => {
    setPreview(!preview);
  };
  
  const categories = [
    { id: 'web-development', label: 'Web Development' },
    { id: 'mobile-app', label: 'Mobile App Development' },
    { id: 'design', label: 'Design & Creative' },
    { id: 'writing', label: 'Writing & Translation' },
    { id: 'data-entry', label: 'Data Entry' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'other', label: 'Other' }
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
        <p className="opacity-90">Fill in the details below to create a new job post and find the perfect freelancer</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          {error}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            className={`py-4 px-6 font-medium text-sm focus:outline-none ${!preview ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setPreview(false)}
          >
            Job Details
          </button>
          <button 
            className={`py-4 px-6 font-medium text-sm focus:outline-none ${preview ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={togglePreview}
            disabled={!title || !description}
          >
            Preview
          </button>
        </div>
        
        {!preview ? (
          <form onSubmit={onSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="title">
                  Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={onChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="e.g. Website Development, Logo Design, etc."
          />
        </div>
        
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={onChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
                Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows="6"
            required
            placeholder="Provide detailed information about the job, requirements, timeline, etc."
          ></textarea>
              <p className="mt-1 text-xs text-gray-500">Detailed descriptions tend to get better proposals</p>
        </div>
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="budget">
                  Budget ($) <span className="text-red-500">*</span>
          </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
          <input
            type="number"
            id="budget"
            name="budget"
            value={budget}
            onChange={onChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            min="1"
            placeholder="Enter your budget"
          />
                </div>
        </div>
        
        <div className="mb-4">
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Specify when the job must be completed. The freelancer must complete the job before this deadline.
                </p>
              </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="requiredSkills">
            Required Skills (comma separated)
          </label>
          <input
            type="text"
            id="requiredSkills"
            name="requiredSkills"
            value={requiredSkills}
            onChange={onChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g. React, Node.js, UI/UX Design, etc."
          />
              <p className="mt-1 text-xs text-gray-500">Adding relevant skills helps attract the right freelancers</p>
        </div>
        
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            Cancel
              </button>
              
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="mr-3 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  disabled={!title || !description}
                >
                  Preview
          </button>
          
          <button
            type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-3">{title}</h2>
              <div className="flex flex-wrap items-center mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-3 mb-2">
                  {categories.find(cat => cat.id === category)?.label || 'Other'}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-3 mb-2">
                  ${budget}
                </span>
                {deadline && (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-2">
                    Deadline: {new Date(deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 mb-4 whitespace-pre-line">{description}</p>
              
              {requiredSkills && (
                <>
                  <h3 className="font-semibold text-gray-800 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap">
                    {requiredSkills.split(',').map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-2">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={togglePreview}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
              >
                Back to Edit
              </button>
              
              <button
                type="button"
                onClick={onSubmit}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateJobPage;