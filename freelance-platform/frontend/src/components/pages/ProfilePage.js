import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    portfolio: user?.portfolio || '',
    skills: user?.skills?.join(', ') || ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { name, portfolio, skills } = formData;
  
  useEffect(() => {
    // Update form data if user changes
    if (user) {
      setFormData({
        name: user.name || '',
        portfolio: user.portfolio || '',
        skills: user.skills?.join(', ') || ''
      });
    }
  }, [user]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Parse skills into array
      const skillsArray = skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);
      
      const res = await axios.put('/api/users/profile', {
        name,
        portfolio,
        skills: skillsArray
      });
      
      // Update user in context
      updateProfile(res.data);
      
      setSuccess('Profile updated successfully!');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Error updating profile');
      console.error(err);
    }
  };
  
  if (!user) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
            {user.role.replace('_', ' ')}
          </div>
        </div>
        
        <div className="mb-2">
          <span className="font-medium">Balance:</span>{' '}
          <span className="text-green-600 font-bold">${user.balance.toFixed(2)}</span>
        </div>
        
        {user.portfolio && (
          <div className="mb-2">
            <span className="font-medium">Portfolio:</span>{' '}
            <a 
              href={user.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {user.portfolio}
            </a>
          </div>
        )}
        
        {user.skills && user.skills.length > 0 && (
          <div>
            <span className="font-medium">Skills:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.skills.map(skill => (
                <span 
                  key={skill} 
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">
            {success}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="portfolio">
              Portfolio URL
            </label>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              value={portfolio}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="https://your-portfolio.com"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="skills">
              Skills (comma separated)
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={skills}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="e.g. React, Node.js, UI/UX Design, etc."
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;