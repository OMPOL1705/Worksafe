import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    portfolio: user?.portfolio || '',
    skills: user?.skills?.join(', ') || '',
    bio: user?.bio || ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState('/default-avatar.png');
  
  const { name, portfolio, skills, bio } = formData;
  
  useEffect(() => {
    // Update form data if user changes
    if (user) {
      setFormData({
        name: user.name || '',
        portfolio: user.portfolio || '',
        skills: user.skills?.join(', ') || '',
        bio: user.bio || ''
      });
      // In a real app, you'd use the user's avatar URL
      // This is just for UI mockup purposes
      setAvatar(user.avatar || '/default-avatar.png');
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
        skills: skillsArray,
        bio
      });
      
      // Update user in context
      updateProfile(res.data);
      
      setSuccess('Profile updated successfully!');
      setLoading(false);
      setIsEditing(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Error updating profile');
      console.error(err);
    }
  };
  
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'freelancer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'job_provider':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'verifier':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information and settings</p>
      </div>
      
      {/* Profile Summary Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32"></div>
        <div className="px-6 sm:px-8 -mt-16 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end mb-6">
            {/* Avatar with fallback to initials */}
            <div className="relative">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={user.name} 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
              
              <div className="mt-2 flex items-center flex-wrap justify-center sm:justify-start">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize mr-2 ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
                <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ${user.balance.toFixed(2)}
                </span>
              </div>
          </div>
            
            <div className="ml-auto mt-4 sm:mt-0">
              <button
                onClick={toggleEditMode}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
          </div>
        </div>
        
          <div className="border-t border-gray-100 pt-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">Account Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-500">Member since:</span>
                      <span className="ml-1 text-gray-900 font-medium">
                        {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
        </div>
        
                  {portfolio && (
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-gray-500">Portfolio:</span>
                      <a 
                        href={portfolio}
              target="_blank"
              rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:text-blue-800 truncate max-w-[200px] inline-block"
            >
                        {portfolio.replace(/^https?:\/\//i, '')}
            </a>
          </div>
        )}
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">Bio</h3>
                <p className="text-gray-700">{bio || 'No bio provided yet.'}</p>
              </div>
            </div>
        
        {user.skills && user.skills.length > 0 && (
              <div className="mt-8">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
              {user.skills.map(skill => (
                <span 
                  key={skill} 
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-gray-100 pt-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user.completedJobs || 0}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Completed Jobs</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${user.balance.toFixed(2)}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">
                  {user.role === 'freelancer' ? 'Total Earnings' : 'Total Spent'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user.reviewCount || 0}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Reviews</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {user.rating ? user.rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Profile</h2>
        
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
          </div>
        )}
        
        {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{success}</p>
                </div>
              </div>
          </div>
        )}
        
        <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                  Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={onChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="portfolio">
              Portfolio URL
            </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              value={portfolio}
              onChange={onChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://your-portfolio.com"
            />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Add your portfolio or website URL
                </p>
              </div>
          </div>
          
          <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="skills">
                Skills
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={skills}
              onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. React, Node.js, UI/UX Design (comma separated)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter your skills separated by commas
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={onChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write a brief introduction about yourself..."
              ></textarea>
          </div>
          
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleEditMode}
                className="mr-4 px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
          <button
            type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
            disabled={loading}
          >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
          </button>
            </div>
        </form>
        </div>
      )}
      
      {/* Security Settings Card - Optional Addition */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8 mt-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
            <p className="text-gray-600 mt-1">Manage your password and security settings</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Change Password
          </button>
        </div>
        
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-700">Password last changed: <span className="font-medium">Never</span></span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span className="text-gray-700">Email: <span className="font-medium">Verified</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;