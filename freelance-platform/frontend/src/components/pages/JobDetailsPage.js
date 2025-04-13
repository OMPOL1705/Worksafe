import React, { useState, useEffect, useContext } from 'react';
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
  
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  if (!job) {
    return <div className="text-center py-4">Job not found</div>;
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
    <div>
      {/* Job access notification for freelancers */}
      {user && user.role === 'freelancer' && !isSelectedFreelancer && job.selectedFreelancer && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
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
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <span className="font-bold">Congratulations!</span> You have been selected for this job. You can now submit your work below.
                <button 
                  onClick={debugJobStatus}
                  className="ml-2 text-xs text-green-700 underline hover:text-green-600"
                >
                  Check Job Status
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <div className="text-xl font-bold text-green-600">${job.budget.toFixed(2)}</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <p className="mb-4 whitespace-pre-line">{job.description}</p>
            
            <h3 className="text-lg font-semibold mb-2">Required Skills:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.requiredSkills.map(skill => (
                <span 
                  key={skill} 
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Job Status: <span className="capitalize font-medium">{job.status}</span></p>
              <p>Posted by: {job.jobProvider.name}</p>
              {job.selectedFreelancer && (
                <p>Assigned to: {job.selectedFreelancer.name}</p>
              )}
            </div>
          </div>
          
          {/* Freelancer application form */}
          {user && user.role === 'freelancer' && job.status === 'open' && !hasApplied && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Apply for this Job</h2>
              <form onSubmit={handleApply}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="price">
                    Your Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={applicationForm.price}
                    onChange={handleApplicationChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                    min="1"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="proposal">
                    Your Proposal
                  </label>
                  <textarea
                    id="proposal"
                    name="proposal"
                    value={applicationForm.proposal}
                    onChange={handleApplicationChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows="5"
                    required
                    placeholder="Explain why you're a good fit for this job..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
                >
                  Submit Application
                </button>
              </form>
            </div>
          )}
          
          {user && user.role === 'freelancer' && hasApplied && job.status === 'open' && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Application</h2>
              <p className="text-gray-600 italic mb-2">
                You have already applied for this job. Please wait for the job provider to review your application.
              </p>
            </div>
          )}
          
          {/* Submission form for assigned freelancer - IMPROVED LOGIC */}
          {user && 
           user.role === 'freelancer' && 
           isSelectedFreelancer && 
           (job.status === 'assigned' || job.status === 'in_progress') && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Submit Work</h2>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                <p className="text-blue-700">
                  <strong>Note:</strong> You're the selected freelancer for this job. 
                  Use this form to submit your work for review by the verifiers.
                </p>
              </div>
              <form onSubmit={handleSubmitWork}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="text">
                    Submission Details
                  </label>
                  <textarea
                    id="text"
                    name="text"
                    value={submissionForm.text}
                    onChange={handleSubmissionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    rows="5"
                    required
                    placeholder="Describe your work submission..."
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="images">
                    Images (Optional)
                  </label>
                  <input
                    type="file"
                    id="images"
                    name="images"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    multiple
                    accept="image/*"
                  />
                  
                  {/* Image previews */}
                  {previewImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Selected Images Preview:</p>
                      <div className="flex flex-wrap gap-2">
                        {previewImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={img.dataUrl} 
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-24 object-cover rounded border border-gray-200"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                              {img.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none"
                >
                  Submit Work
                </button>
              </form>
            </div>
          )}
          
          {/* Submission list with images */}
          {submissions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Work Submissions</h2>
              
              {submissions.map(submission => (
                <div key={submission._id} className="mb-4 border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        Submitted by {submission.freelancer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        on {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-sm rounded ${
                      submission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="mb-3">{submission.text}</p>
                  
                  {/* Display images - now using localStorage */}
                  {submission.images && submission.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Images:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.images.map((imageId, index) => {
                          const image = getImageFromStorage(imageId);
                          
                          if (image && image.dataUrl) {
                            return (
                              <div 
                                key={index} 
                                className="relative cursor-pointer group" 
                                onClick={() => openImageViewer(imageId)}
                              >
                                <img 
                                  src={image.dataUrl} 
                                  alt={`Image ${index + 1}`}
                                  className="h-32 w-32 object-cover rounded border border-gray-200 hover:shadow-md transition"
                                />
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                  Click to view
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={index} className="flex items-center p-2 rounded bg-gray-100">
                                <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span className="text-sm">Image {index + 1}</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Verifications:</p>
                    <div className="space-y-1">
                      {submission.verifications.map(verification => (
                        <div key={verification._id} className="flex items-center text-sm">
                          <span className={`w-4 h-4 rounded-full mr-2 ${
                            verification.approved ? 'bg-green-500' : 'bg-gray-300'
                          }`}></span>
                          <span>{verification.verifier.name}: </span>
                          <span className="ml-1">
                            {verification.approved 
                              ? 'Approved' 
                              : verification.comments 
                                ? 'Commented' 
                                : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          {/* Job Provider Actions */}
          {user && user.role === 'job_provider' && job.jobProvider._id === user._id && job.status === 'open' && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Select Freelancer</h2>
              
              {job.applicants.length === 0 ? (
                <p className="text-gray-600">No applications yet.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-gray-700">
                        Select Verifiers (at least 1)
                      </label>
                      <button 
                        type="button"
                        onClick={debugJobStatus}
                        className="text-xs text-blue-600 underline"
                      >
                        Check Status
                      </button>
                    </div>
                    
                    {verifiersLoading ? (
                      <p className="text-sm text-gray-500">Loading verifiers...</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded">
                        {verifiers && verifiers.length > 0 ? (
                          verifiers.map(verifier => (
                            <div key={verifier._id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`verifier-${verifier._id}`}
                                checked={selectedVerifiers.includes(verifier._id)}
                                onChange={() => handleToggleVerifier(verifier._id)}
                                className="mr-2"
                              />
                              <label htmlFor={`verifier-${verifier._id}`}>
                                {verifier.name}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-red-500">
                            No verifiers available. Please make sure there are verifier users in the system.
                          </p>
                        )}
                      </div>
                    )}
                    
                    {verifiers.length === 0 && !verifiersLoading && (
                      <div className="mt-2 p-2 border border-red-200 bg-red-50 rounded text-sm">
                        <p>You need at least one verifier to select a freelancer. 
                        Please create verifier accounts in the system first.</p>
                      </div>
                    )}
                  </div>

                  {/* Filtering and sorting UI */}
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h3 className="font-medium mb-2">Filter & Sort Applicants</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Filter by Skill</label>
                        <input
                          type="text"
                          value={filterSkill}
                          onChange={(e) => setFilterSkill(e.target.value)}
                          placeholder="Enter skill name..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Sort By</label>
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Applicant list */}
                  <div className="space-y-4">
                    {getSortedAndFilteredApplicants().map(app => (
                      <div key={app._id} className="border p-4 rounded">
                                                <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{app.freelancer.name}</h3>
                          <span className="font-bold text-green-600">${app.price.toFixed(2)}</span>
                        </div>
                        
                        <p className="text-sm mb-3">{app.proposal}</p>
                        
                        <div className="mb-2">
                          <span className="text-sm font-medium">Skills: </span>
                          {app.freelancer.skills.map(skill => (
                            <span 
                              key={skill} 
                              className="inline-block mr-1 px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        
                        {/* Main select button */}
                        <button
                          type="button"
                          onClick={() => handleSelectFreelancer(app.freelancer._id)}
                          className={`w-full py-2 px-4 rounded focus:outline-none ${
                            verifiers.length > 0 && selectedVerifiers.length > 0
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                          disabled={verifiers.length === 0 || selectedVerifiers.length === 0}
                        >
                          Select this Freelancer
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Applicants list for job providers */}
          {user && user.role === 'job_provider' && job.jobProvider._id === user._id && job.status !== 'open' && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Selected Freelancer</h2>
              <div className="mb-4">
                <p className="font-semibold">{job.selectedFreelancer.name}</p>
                <p className="text-sm text-gray-600">{job.selectedFreelancer.email}</p>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Verifiers</h3>
              <ul className="list-disc list-inside">
                {job.verifiers.map(verifier => (
                  <li key={verifier._id} className="text-sm">
                    {verifier.name}
                  </li>
                ))}
              </ul>
              
              {/* Important: Button to update job status if still in "assigned" state */}
              {job.status === 'assigned' && (
                <div className="mt-4 pt-4 border-t">
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
                    className="w-full py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                  >
                    Start Job (Set to In Progress)
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Job Status for everyone */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Job Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium capitalize ${
                  job.status === 'open' ? 'text-blue-600' :
                  job.status === 'assigned' ? 'text-orange-600' :
                  job.status === 'in_progress' ? 'text-purple-600' :
                  job.status === 'completed' ? 'text-green-600' : ''
                }`}>{job.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Applications:</span>
                <span>{job.applicants.length}</span>
              </div>
              {job.selectedFreelancer && (
                <div className="flex justify-between">
                  <span>Freelancer:</span>
                  <span>{job.selectedFreelancer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Budget:</span>
                <span className="font-bold text-green-600">${job.budget.toFixed(2)}</span>
              </div>
              {job.status === 'completed' && (
                <div className="mt-4 pt-4 border-t text-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Job Completed
                  </span>
                </div>
              )}
            </div>
            
            {/* Button to navigate to the jobs list for freelancers */}
            {user && user.role === 'freelancer' && (
              <div className="mt-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={navigateToMyJobs}
                  className="w-full py-2 px-4 rounded bg-gray-500 text-white hover:bg-gray-600 focus:outline-none"
                >
                  View All My Jobs
                </button>
              </div>
            )}
          </div>
          
          {/* Quick info about job visibility for freelancers */}
          {user && user.role === 'freelancer' && (
            <div className="bg-white p-4 rounded-lg shadow-md mt-4 text-sm">
              <h3 className="font-medium mb-2">Job Visibility Info</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Open jobs: Visible to all freelancers</li>
                <li>• Assigned/In Progress jobs: Only visible to the selected freelancer</li>
                <li>• Your assigned jobs can be found in the "My Jobs" section</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Debug floating panel - only visible during certain conditions */}
      {user && user.role === 'freelancer' && job.selectedFreelancer && !isSelectedFreelancer && (
        <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg border-2 border-yellow-500 max-w-md z-10">
          <h3 className="font-bold text-lg mb-2">Looking for your assigned jobs?</h3>
          <p className="text-sm mb-2">This job is assigned to another freelancer. Your assigned jobs can be found in the My Jobs section.</p>
          <button 
            onClick={navigateToMyJobs}
            className="w-full mt-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Go to My Jobs
          </button>
        </div>
      )}
      
      {/* Helper panel for selected freelancers to debug visibility issues */}
      {user && 
       user.role === 'freelancer' && 
       job.selectedFreelancer && 
       isSelectedFreelancer && 
       (job.status === 'assigned' || job.status === 'in_progress') && (
        <div className="fixed bottom-4 right-4 p-4 bg-white shadow-lg rounded-lg border-2 border-green-500 max-w-md z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">You are assigned to this job!</h3>
            <button 
              onClick={() => document.querySelector('.fixed.bottom-4.right-4').remove()}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="text-sm">
            <p className="mb-2">Job Status: <span className="font-semibold capitalize">{job.status.replace('_', ' ')}</span></p>
            <p className="mb-2 text-green-600 font-medium">You can submit your work using the form above.</p>
            <p className="text-xs text-gray-500">If you're having trouble seeing your work submission form, try refreshing the page.</p>
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Refresh Page
              </button>
              <button 
                onClick={debugJobStatus}
                className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reminder panel for job providers to update job status */}
      {user && 
       user.role === 'job_provider' && 
       job.jobProvider._id === user._id && 
       job.selectedFreelancer && 
       job.status === 'assigned' && (
        <div className="fixed bottom-4 left-4 p-4 bg-white shadow-lg rounded-lg border-2 border-blue-500 max-w-md z-10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Job Assigned - Next Steps</h3>
            <button 
              onClick={() => document.querySelector('.fixed.bottom-4.left-4').remove()}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-sm mb-3">
            You've selected a freelancer, but the job is still in "assigned" status. 
            Change to "in progress" so the freelancer can submit work.
          </p>
          <button
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
                
                // Remove the notification panel
                document.querySelector('.fixed.bottom-4.left-4').remove();
                
                alert('Job status updated to "in progress"!');
              } catch (error) {
                console.error('Error updating job status:', error);
                alert('Error updating job status: ' + error.response?.data?.message || 'Unknown error');
              }
            }}
            className="w-full py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
          >
            Update to "In Progress" Status
          </button>
        </div>
      )}
      
      {/* Image viewer modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeImageViewer}>
          <div className="relative max-w-4xl max-h-screen p-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeImageViewer}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
            >
              ×
            </button>
            <img 
              src={viewingImage} 
              alt="Full size preview" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
      
      {/* Debug panel - hidden in production, useful for testing */}
      {user && user.role === 'verifier' && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded shadow-lg border border-gray-200 z-40">
          <h4 className="font-medium text-sm mb-1">Debug: Storage Info</h4>
          <button
            onClick={() => {
              try {
                const storageKey = `job_images_${id}`;
                const storedData = localStorage.getItem(storageKey);
                if (storedData) {
                  const images = JSON.parse(storedData);
                  alert(`Found ${Object.keys(images).length} stored images for this job`);
                  console.log('Stored images:', images);
                } else {
                  alert('No stored images found for this job');
                }
              } catch (error) {
                alert('Error checking storage: ' + error.message);
              }
            }}
            className="bg-blue-500 text-white text-xs py-1 px-2 rounded"
          >
            Check Image Storage
          </button>
        </div>
      )}
    </div>
  );
};

export default JobDetailsPage;