import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const JobDetailsPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    price: '',
    proposal: ''
  });
  const [verifiers, setVerifiers] = useState([]);
  const [selectedVerifiers, setSelectedVerifiers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionForm, setSubmissionForm] = useState({
    text: '',
    images: []
  });
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterSkill, setFilterSkill] = useState('');
  const [verifiersLoading, setVerifiersLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [sharedImages, setSharedImages] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Set up axios with auth headers
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);
  
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure we have the auth token for authenticated requests
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        console.log(`Fetching job details for ID: ${id} with token: ${token ? 'Present' : 'Missing'}`);
        
        const res = await axios.get(`http://localhost:5000/api/jobs/${id}`, { headers });
        console.log('Job data received:', res.data);
        
        setJob(res.data);
        
        // Set initial application price to job budget
        setApplicationForm(prev => ({
          ...prev,
          price: res.data.budget
        }));
        
        // Fetch submissions for any job that has a selected freelancer
        if (res.data.selectedFreelancer) {
          console.log('Job has selected freelancer, fetching submissions');
          try {
            const submissionsRes = await axios.get(`http://localhost:5000/api/submissions/job/${id}`, { headers });
          setSubmissions(submissionsRes.data);
          } catch (submissionError) {
            console.error('Error fetching submissions:', submissionError);
            // Don't fail completely if submissions can't be fetched
          }
        }
        
        // Debug information
        const isUserSelectedFreelancer = user && 
                                         res.data.selectedFreelancer && 
                                         user._id === res.data.selectedFreelancer._id;
        
        console.log('Debug - Is user selected freelancer?', {
          userID: user?._id,
          selectedFreelancerID: res.data.selectedFreelancer?._id,
          isMatch: isUserSelectedFreelancer
        });
        
        setDebugInfo({
          jobStatus: res.data.status,
          selectedFreelancerId: res.data.selectedFreelancer?._id,
          currentUserId: user?._id,
          isCurrentUserSelectedFreelancer: isUserSelectedFreelancer,
          timeAccessed: new Date().toISOString()
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError(`Failed to load job: ${error.message}`);
        setLoading(false);
      }
    };
    
    const fetchVerifiers = async () => {
      if (user && user.role === 'job_provider') {
        setVerifiersLoading(true);
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            console.error('No auth token found');
            setVerifiersLoading(false);
            return;
          }
          
          const res = await axios.get('http://localhost:5000/api/users/verifiers', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            console.log('Verifiers loaded:', res.data.length, res.data);
          setVerifiers(res.data);
            // Auto-select the first verifier
            setSelectedVerifiers([res.data[0]._id]);
          } else {
            console.log('No verifiers returned from API');
            setVerifiers([]);
          }
        } catch (error) {
          console.error('Error fetching verifiers:', error);
          setVerifiers([]);
        } finally {
          setVerifiersLoading(false);
        }
      }
    };
    
    fetchJobDetails();
    fetchVerifiers();
  }, [id, user]);
  
  useEffect(() => {
    // Clean up object URLs when component unmounts
    return () => {
      previewImages.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url);
      });
    };
  }, [previewImages]);
  
  useEffect(() => {
    if (messagesEndRef.current && chatOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);
  
  useEffect(() => {
    if (chatOpen && job) {
      fetchChatMessages();
    }
  }, [chatOpen, job]);
  
  const handleApplicationChange = (e) => {
    setApplicationForm({ ...applicationForm, [e.target.name]: e.target.value });
  };
  
  const handleSubmissionChange = (e) => {
    setSubmissionForm({ ...submissionForm, [e.target.name]: e.target.value });
  };
  
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageObj = {
          id: `image_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          name: file.name,
          dataUrl: e.target.result,
          type: file.type
        };
        
        // Add to preview images
        setPreviewImages(prev => [...prev, imageObj]);
        
        // Update submission form with image ID
        setSubmissionForm(prev => ({
          ...prev,
          images: [...prev.images, imageObj.id]
        }));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Function to remove image from preview
  const removeImage = (index) => {
    setPreviewImages(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    setSubmissionForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const handleApply = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:5000/api/jobs/${id}/apply`, {
        price: parseFloat(applicationForm.price),
        proposal: applicationForm.proposal
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh job to show updated applicants
      const res = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setJob(res.data);
      
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Error applying for job: ' + error.response?.data?.message || 'Unknown error');
    }
  };
  
  const handleToggleVerifier = (verifierId) => {
    if (selectedVerifiers.includes(verifierId)) {
      // Don't allow deselecting if it's the only verifier
      if (selectedVerifiers.length > 1) {
      setSelectedVerifiers(selectedVerifiers.filter(id => id !== verifierId));
      }
    } else {
      setSelectedVerifiers([...selectedVerifiers, verifierId]);
    }
  };
  
  const handleSelectFreelancer = async (freelancerId) => {
    try {
      // Validate inputs before making API call
      if (selectedVerifiers.length === 0) {
        alert('Please select at least one verifier.');
        return;
      }
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('You need to be logged in to select a freelancer.');
        navigate('/login');
        return;
      }
      
      // Log the request for debugging
      console.log('Sending request to select freelancer:', {
        freelancerId,
        verifierIds: selectedVerifiers
      });
      
      const response = await axios.put(
        `http://localhost:5000/api/jobs/${id}/select-freelancer`, 
        {
          freelancerId,
          verifierIds: selectedVerifiers // Send array of verifier IDs
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the job with the new data
      setJob(response.data);
      
      // Show success message
      alert('Freelancer selected successfully! The freelancer can now view this job in their assigned jobs list.');
    } catch (error) {
      console.error('Error selecting freelancer:', error);
      
      // Provide a helpful error message
      let errorMessage = 'An unknown error occurred.';
      
      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown server error'}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = `Request error: ${error.message}`;
      }
      
      alert(`Error selecting freelancer: ${errorMessage}`);
    }
  };
  
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    
    try {
      // Store images in localStorage keyed by their IDs
      const storageKey = `job_images_${id}`;
      
      // Get existing images from localStorage or initialize empty object
      let existingImages = {};
      try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          existingImages = JSON.parse(storedData);
        }
      } catch (error) {
        console.error('Error loading existing images:', error);
      }
      
      // Add new images to the object
      const updatedImages = { ...existingImages };
      previewImages.forEach(img => {
        updatedImages[img.id] = {
          name: img.name,
          dataUrl: img.dataUrl,
          type: img.type
        };
      });
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedImages));
      console.log('Saved images to localStorage', Object.keys(updatedImages).length);
      
      // Submit to server with image IDs
      const token = localStorage.getItem('authToken');
      await axios.post('http://localhost:5000/api/submissions', {
        jobId: id,
        text: submissionForm.text,
        images: previewImages.map(img => img.id) // Send the image IDs
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Refresh submissions
      const submissionsRes = await axios.get(`http://localhost:5000/api/submissions/job/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSubmissions(submissionsRes.data);
      
      // Reset form and previews
      setSubmissionForm({
        text: '',
        images: []
      });
      setPreviewImages([]);
      
      alert('Submission added successfully!');
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('Error submitting work: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Function to get image from localStorage by ID
  const getImageFromStorage = (imageId) => {
    try {
      const storageKey = `job_images_${id}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const images = JSON.parse(storedData);
        return images[imageId];
      }
    } catch (error) {
      console.error('Error retrieving image:', error);
    }
    return null;
  };
  
  // Function to handle clicking on images
  const openImageViewer = (imageId) => {
    const image = getImageFromStorage(imageId);
    if (image && image.dataUrl) {
      setViewingImage(image.dataUrl);
    } else {
      alert('Image could not be loaded');
    }
  };
  
  // Function to close the image viewer
  const closeImageViewer = () => {
    setViewingImage(null);
  };
  
  // Debug function to check verifiers state
  const debugJobStatus = () => {
    console.log('Current job:', job);
    console.log('User info:', user);
    console.log('Debug Info:', debugInfo);
    alert(`Job ID: ${job._id}\nJob Status: ${job.status}\nSelected Freelancer: ${job.selectedFreelancer?._id}\nCurrent User: ${user?._id}\nRole: ${user?.role}\n\nCheck console for more details`);
  };
  
  // Function to help freelancers navigate to their jobs
  const navigateToMyJobs = () => {
    navigate('/my-jobs');
  };
  
  // Function to generate a fake image preview URL for stored filenames
  const getImagePreviewUrl = (filename) => {
    // If it's a URL, return it directly
    if (filename.startsWith('http')) return filename;
    
    // Otherwise, generate a random color for placeholder
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Return data URL for placeholder
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}" /><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">${filename.split('.').pop().toUpperCase()}</text></svg>`;
  };
  
  // Updated to use backend API instead of mock data
  const fetchChatMessages = async () => {
    try {
      setChatLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found for fetching chat messages');
        setChatLoading(false);
        return;
      }
      
      // Make API call to get messages for this job
      const response = await axios.get(`http://localhost:5000/api/chat/job/${job._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Chat messages loaded from database:', response.data);
      setMessages(response.data);
      setChatLoading(false);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      
      // Handle specific error cases
      if (error.response && error.response.status === 401) {
        console.log('Authentication error when fetching messages. Please log in again.');
        // Optionally redirect to login here
      }
      
      setChatLoading(false);
      setMessages([]); // Reset messages on error
    }
  };
  
  // Updated to store messages in database via API
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !job) return;
    
    try {
      // Create a temporary message object for immediate UI feedback
      const tempMessageObj = {
        _id: `temp-${Date.now()}`,
        sender: { 
          _id: user._id, 
          name: user.name, 
          role: user.role 
        },
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        pending: true
      };
      
      // Add to messages immediately for UI feedback
      setMessages(prev => [...prev, tempMessageObj]);
      setNewMessage('');
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Send to API 
      const response = await axios.post('http://localhost:5000/api/chat/messages', {
        jobId: job._id,
        text: newMessage.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Message saved to database:', response.data);
      
      // Replace temporary message with confirmed message from server
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessageObj._id 
            ? response.data // Use the server-returned message
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error state for the message
      setMessages(prev => 
        prev.map(msg => 
          msg._id === `temp-${Date.now()}` 
            ? { ...msg, error: true, errorMessage: error.response?.data?.msg || 'Failed to send' } 
            : msg
        )
      );
      
      // Optional: Display error to user
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Optionally redirect to login
      } else {
        console.error('Error details:', error.response?.data || error.message);
      }
    }
  };
  
  // Format timestamp for chat messages
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    
    return 'Just now';
  };
  
  // Get avatar background color based on user role
  const getAvatarColor = (role) => {
    switch (role) {
      case 'freelancer':
        return 'bg-blue-500';
      case 'job_provider':
        return 'bg-purple-500';
      case 'verifier':
        return 'bg-green-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name || name === 'System') return '📣';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Check if user can access chat
  const canAccessChat = () => {
    if (!user || !job) return false;
    
    // Job provider can always access
    if (user._id === job.jobProvider._id) return true;
    
    // Selected freelancer can access 
    if (job.selectedFreelancer && user._id === job.selectedFreelancer._id) return true;
    
    // Verifiers can access
    if (job.verifiers.some(v => v._id === user._id)) return true;
    
    return false;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-2xl mx-auto my-10 text-center">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Job</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto my-10 text-center">
        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">Job Not Found</h2>
        <p className="text-yellow-600 mb-6">The job you're looking for could not be found.</p>
        <button 
          onClick={() => navigate('/jobs')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Back to Job Listings
        </button>
      </div>
    );
  }
  
  // Check if user has already applied
  const hasApplied = user && job.applicants.some(
    app => app.freelancer._id === user._id
  );

  // Check if the current user is the selected freelancer
  const isSelectedFreelancer = user && job.selectedFreelancer && user._id === job.selectedFreelancer._id;

  // Get sorted and filtered applicants
  const getSortedAndFilteredApplicants = () => {
    if (!job || !job.applicants) return [];
    
    let filteredApplicants = [...job.applicants];
    
    // Apply skill filtering
    if (filterSkill) {
      filteredApplicants = filteredApplicants.filter(app => 
        app.freelancer.skills.some(skill => 
          skill.toLowerCase().includes(filterSkill.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    filteredApplicants.sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (sortBy === 'skills') {
        // Sort by number of matching skills with the required skills
        const aMatchCount = job.requiredSkills.filter(skill => 
          a.freelancer.skills.includes(skill)
        ).length;
        
        const bMatchCount = job.requiredSkills.filter(skill => 
          b.freelancer.skills.includes(skill)
        ).length;
        
        return sortOrder === 'asc' ? aMatchCount - bMatchCount : bMatchCount - aMatchCount;
      }
      return 0;
    });
    
    return filteredApplicants;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Job access notification for freelancers */}
      {user && user.role === 'freelancer' && !isSelectedFreelancer && job.selectedFreelancer && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This job has been assigned to another freelancer. You can view your assigned jobs in the My Jobs section.
                <button 
                  onClick={navigateToMyJobs}
                  className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  Go to My Jobs
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success notification for selected freelancer */}
      {user && user.role === 'freelancer' && isSelectedFreelancer && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-bold">Congratulations!</span> You have been selected for this job. You can now submit your work below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Job Header with breadcrumbs */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
          <button onClick={() => navigate('/jobs')} className="hover:text-blue-600">
            Jobs
          </button>
          <svg className="mx-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
          <span className="text-gray-700">Job Details</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
    <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                job.status === 'open' ? 'bg-blue-100 text-blue-800' :
                job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                job.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                job.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className="text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Posted by {job.jobProvider.name}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Budget</div>
              <div className="text-2xl font-bold text-green-600">${job.budget.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Job Description</h2>
            <div className="prose max-w-none">
              <p className="mb-6 text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>
            
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Required Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.requiredSkills.map(skill => (
                <span 
                  key={skill} 
                  className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* Freelancer application form */}
          {user && user.role === 'freelancer' && job.status === 'open' && !hasApplied && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Apply for this Job</h2>
              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium" htmlFor="price">
                    Your Price ($)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={applicationForm.price}
                    onChange={handleApplicationChange}
                      className="pl-8 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min="1"
                  />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Set a competitive price to increase your chances</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 font-medium" htmlFor="proposal">
                    Your Proposal
                  </label>
                  <textarea
                    id="proposal"
                    name="proposal"
                    value={applicationForm.proposal}
                    onChange={handleApplicationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="6"
                    required
                    placeholder="Explain why you're a good fit for this job, your relevant experience, and how you plan to approach the work..."
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">A detailed proposal increases your chances of being selected</p>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit Application
                </button>
              </form>
            </div>
          )}
          
          {user && user.role === 'freelancer' && hasApplied && job.status === 'open' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
              <div className="flex items-start">
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                <h2 className="text-xl font-bold mb-2 text-gray-900">Application Submitted</h2>
                  <p className="text-gray-700">
                    Your application has been submitted successfully. The job provider will review it and may select you for this project.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Tip:</span> Continue browsing other job opportunities while you wait for a response.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Submission form for assigned freelancer */}
          {user && 
           user.role === 'freelancer' && 
           isSelectedFreelancer && 
           (job.status === 'assigned' || job.status === 'in_progress') && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Submit Your Work</h2>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                <p className="text-blue-700 flex items-start">
                  <svg className="w-5 h-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>
                    As the selected freelancer, use this form to submit your completed work for verification.
                    All submissions will be reviewed by the assigned verifiers.
                  </span>
                </p>
              </div>
              
              <form onSubmit={handleSubmitWork} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="text">
                    Submission Details
                  </label>
                  <textarea
                    id="text"
                    name="text"
                    value={submissionForm.text}
                    onChange={handleSubmissionChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="6"
                    required
                    placeholder="Describe your completed work, include any notes for the client and verifiers..."
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">Be detailed about what you've accomplished and any challenges you faced</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="images">
                    Upload Images <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="images"
                    name="images"
                    onChange={handleImageChange}
                      className="hidden"
                    multiple
                    accept="image/*"
                  />
                    <label htmlFor="images" className="cursor-pointer flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span className="text-blue-600 font-medium">Click to upload images</span>
                      <span className="text-gray-500 text-sm mt-1">Drag and drop supported</span>
                    </label>
                  </div>
                  
                  {/* Image previews */}
                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Images ({previewImages.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {previewImages.map((img, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={img.dataUrl} 
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                              {img.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Submit Work for Verification
                </button>
              </form>
            </div>
          )}
          
          {/* Submission list with images */}
          {submissions.length > 0 && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Work Submissions
              </h2>
              
              <div className="space-y-8">
              {submissions.map(submission => (
                  <div key={submission._id} className="border-b border-gray-100 pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                          {submission.freelancer.name.charAt(0).toUpperCase()}
                        </div>
                    <div>
                          <h3 className="font-medium text-gray-900">
                            {submission.freelancer.name}
                          </h3>
                      <p className="text-sm text-gray-500">
                            {new Date(submission.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                      </p>
                    </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                      submission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {submission.status}
                    </span>
                  </div>
                  
                    <div className="prose prose-sm max-w-none mb-6">
                      <p className="text-gray-700">{submission.text}</p>
                    </div>
                    
                    {/* Display images */}
                    {submission.images && submission.images.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Attached Images ({submission.images.length})</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {submission.images.map((imageId, index) => {
                            const image = getImageFromStorage(imageId);
                            
                            if (image && image.dataUrl) {
                              return (
                                <div 
                                  key={index} 
                                  className="relative cursor-pointer group rounded-lg overflow-hidden" 
                                  onClick={() => openImageViewer(imageId)}
                                >
                                  <img 
                                    src={image.dataUrl} 
                                    alt={`Image ${index + 1}`}
                                    className="h-32 w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                                    Click to view full size
                          </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="flex items-center p-4 rounded-lg bg-gray-100">
                                  <svg className="w-8 h-8 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  <span className="text-sm text-gray-600">Image {index + 1}</span>
                                </div>
                              );
                            }
                          })}
                      </div>
                    </div>
                  )}
                  
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Verification Status</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {submission.verifications.map(verification => (
                          <div key={verification._id} className="flex items-start">
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 mr-3 ${
                            verification.approved ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">{verification.verifier.name}</span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className={`text-sm ${
                                  verification.approved 
                                    ? 'text-green-600' 
                                    : verification.comments 
                                      ? 'text-orange-600' 
                                      : 'text-gray-500'
                                }`}>
                            {verification.approved 
                              ? 'Approved' 
                              : verification.comments 
                                ? 'Commented' 
                                      : 'Pending Review'}
                          </span>
                              </div>
                              {verification.comments && (
                                <p className="text-sm text-gray-700 mt-1 bg-white p-3 rounded border border-gray-100">
                                  "{verification.comments}"
                                </p>
                              )}
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1 space-y-8">
          {/* Job Provider Actions */}
          {user && user.role === 'job_provider' && job.jobProvider._id === user._id && job.status === 'open' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Select Freelancer
              </h2>
              
              {job.applicants.length === 0 ? (
                <div className="text-center py-6 px-4 bg-gray-50 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                  <p className="text-gray-600 mb-2">No applications yet.</p>
                  <p className="text-sm text-gray-500">Check back later or consider adjusting your job description.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-gray-700 font-medium">
                        Select Verifiers <span className="text-red-500">*</span>
                    </label>
                    </div>
                    
                    {verifiersLoading ? (
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">Loading verifiers...</span>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                        {verifiers && verifiers.length > 0 ? (
                          verifiers.map(verifier => (
                            <div key={verifier._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id={`verifier-${verifier._id}`}
                            checked={selectedVerifiers.includes(verifier._id)}
                            onChange={() => handleToggleVerifier(verifier._id)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                              <label htmlFor={`verifier-${verifier._id}`} className="ml-2 block text-sm text-gray-900">
                            {verifier.name}
                          </label>
                        </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-red-500">
                              No verifiers available.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Please make sure there are verifier users in the system.
                            </p>
                    </div>
                        )}
                  </div>
                    )}
                    
                    {verifiers.length === 0 && !verifiersLoading && (
                      <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100 text-sm text-red-700">
                        <p className="flex items-start">
                          <svg className="w-5 h-5 mr-2 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          You need at least one verifier to select a freelancer. Please create verifier accounts in the system first.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Filtering and sorting UI */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-3 text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                      Filter & Sort
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Filter by Skill</label>
                        <input
                          type="text"
                          value={filterSkill}
                          onChange={(e) => setFilterSkill(e.target.value)}
                          placeholder="Enter skill name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Sort By</label>
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="price">Price</option>
                          <option value="skills">Matching Skills</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Order</label>
                        <select 
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Applicant list */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Applicants ({getSortedAndFilteredApplicants().length})
                    </h3>
                    
                    {getSortedAndFilteredApplicants().length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No applicants match your current filters.</p>
                    ) : (
                      getSortedAndFilteredApplicants().map(app => (
                        <div key={app._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{app.freelancer.name}</h3>
                          <span className="font-bold text-green-600">${app.price.toFixed(2)}</span>
                        </div>
                        
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{app.proposal}</p>
                        
                          <div className="mb-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                          {app.freelancer.skills.map(skill => (
                            <span 
                              key={skill} 
                                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                                    job.requiredSkills.includes(skill)
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                            >
                              {skill}
                            </span>
                          ))}
                            </div>
                        </div>
                        
                        <button
                            type="button"
                          onClick={() => handleSelectFreelancer(app.freelancer._id)}
                            className={`w-full py-2 px-4 rounded-lg focus:outline-none flex items-center justify-center transition-colors ${
                              verifiers.length > 0 && selectedVerifiers.length > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={verifiers.length === 0 || selectedVerifiers.length === 0}
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          Select this Freelancer
                        </button>
                      </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Selected Freelancer for job providers */}
          {user && user.role === 'job_provider' && job.jobProvider._id === user._id && job.status !== 'open' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Selected Freelancer
              </h2>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3 flex-shrink-0">
                    {job.selectedFreelancer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                  <h3 className="font-semibold text-gray-900">{job.selectedFreelancer.name}</h3>
                <p className="text-sm text-gray-600">{job.selectedFreelancer.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Verifiers</h3>
                <ul className="space-y-2">
                {job.verifiers.map(verifier => (
                    <li key={verifier._id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-2">
                        {verifier.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-800">{verifier.name}</span>
                  </li>
                ))}
              </ul>
              </div>
              
              {/* Button to update job status if still in "assigned" state */}
              {job.status === 'assigned' && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('authToken');
                        const response = await axios.put(
                          `http://localhost:5000/api/jobs/${job._id}/update-status`, 
                          { status: 'in_progress' },
                          { headers: { 'Authorization': `Bearer ${token}` }}
                        );
                        
                        // Update the job with the new data
                        setJob(response.data);
                        
                        alert('Job status updated to "in progress"!');
                      } catch (error) {
                        console.error('Error updating job status:', error);
                        alert('Error updating job status: ' + error.response?.data?.message || 'Unknown error');
                      }
                    }}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Start Job (Set to In Progress)
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Job Status for everyone */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Job Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className={`font-medium capitalize ${
                    job.status === 'open' ? 'text-blue-600' :
                    job.status === 'assigned' ? 'text-orange-600' :
                    job.status === 'in_progress' ? 'text-purple-600' :
                    job.status === 'completed' ? 'text-green-600' : ''
                  }`}>
                    <span className="flex items-center">
                      {job.status === 'open' && (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      )}
                      {job.status === 'assigned' && (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      )}
                      {job.status === 'in_progress' && (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                      )}
                      {job.status === 'completed' && (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                      {job.status.replace('_', ' ')}
                    </span>
                  </p>
              </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Applicants</p>
                  <p className="font-medium">{job.applicants.length}</p>
              </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Job Posted</p>
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              {job.selectedFreelancer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Selected Freelancer</p>
                  <p className="font-medium">{job.selectedFreelancer.name}</p>
                </div>
              )}
              
              {job.status === 'completed' && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
                    <svg className="inline-block w-4 h-4 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Job Successfully Completed
                  </span>
                </div>
              )}
            </div>
            
            {/* Button to navigate to the jobs list for freelancers */}
            {user && user.role === 'freelancer' && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={navigateToMyJobs}
                  className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                  </svg>
                  View All My Jobs
                </button>
          </div>
            )}
        </div>
          
          {/* Quick info about job visibility for freelancers */}
          {user && user.role === 'freelancer' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-medium mb-4 text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Job Visibility Information
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Open jobs are visible to all freelancers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Assigned and in-progress jobs are only visible to the selected freelancer</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Your assigned jobs can be found in the "My Jobs" section</span>
                </li>
              </ul>
      </div>
          )}
        </div>
      </div>
      
      {/* Image viewer modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeImageViewer}>
          <div className="relative max-w-4xl max-h-screen p-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeImageViewer}
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 hover:bg-red-700 transition-colors"
              aria-label="Close image viewer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <img 
              src={viewingImage} 
              alt="Full size preview" 
              className="max-w-full max-h-[90vh] object-contain mx-auto shadow-2xl"
            />
          </div>
        </div>
      )}
      
      {/* Chat section - only visible to job participants when a freelancer is selected */}
      {job && job.status !== 'open' && canAccessChat() && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Project Communication</h2>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded font-medium text-sm transition-colors"
            >
              {chatOpen ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  Hide Chat
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Show Chat ({messages.length})
                </>
              )}
            </button>
          </div>
          
          {chatOpen && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Chat header with participants */}
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <h3 className="text-sm font-medium">Chat with project team</h3>
                </div>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="mr-2">Participants:</span>
                  <div className="flex -space-x-2 mr-2">
                    {/* Job Provider */}
                    <div 
                      className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                      title={`${job.jobProvider.name} (Job Provider)`}
                    >
                      {getInitials(job.jobProvider.name)}
                    </div>
                    
                    {/* Selected Freelancer */}
                    {job.selectedFreelancer && (
                      <div 
                        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                        title={`${job.selectedFreelancer.name} (Freelancer)`}
                      >
                        {getInitials(job.selectedFreelancer.name)}
                      </div>
                    )}
                    
                    {/* Verifiers */}
                    {job.verifiers.map((verifier) => (
                      <div 
                        key={verifier._id}
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                        title={`${verifier.name} (Verifier)`}
                      >
                        {getInitials(verifier.name)}
                      </div>
                    ))}
                  </div>
                  <span className="truncate max-w-xs">
                    {job.jobProvider.name}
                    {job.selectedFreelancer && `, ${job.selectedFreelancer.name}`}
                    {job.verifiers.length > 0 && `, ${job.verifiers.map(v => v.name).join(', ')}`}
                  </span>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                {chatLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-pulse text-gray-500">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-center max-w-xs">
                      No messages yet. Start the conversation by sending a message.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.sender._id === user._id;
                      const isSystemMessage = message.isSystemMessage;
                      
                      return (
                        <div key={message._id} className={isSystemMessage ? "flex justify-center" : `flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                          {isSystemMessage ? (
                            <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm max-w-md text-center">
                              {message.text}
                            </div>
                          ) : (
                            <div className="max-w-[75%]">
                              <div className={`flex items-start gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(message.sender.role)}`}>
                                  {getInitials(message.sender.name)}
                                </div>
                                <div>
                                  <div className={`rounded-lg px-4 py-2 ${
                                    isCurrentUser
                                      ? "bg-blue-600 text-white"
                                      : "bg-white border border-gray-200 text-gray-800"
                                  }`}>
                                    {message.text}
                                  </div>
                                  <div className={`text-xs mt-1 text-gray-500 flex items-center ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                    <span className="font-medium mr-1">
                                      {isCurrentUser ? "You" : message.sender.name}
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span>{formatMessageTime(message.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`p-2 rounded-lg ${
                      newMessage.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Messages are visible to all project participants: job provider, freelancer, and verifiers.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;