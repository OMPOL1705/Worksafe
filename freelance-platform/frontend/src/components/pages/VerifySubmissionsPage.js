import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const VerifySubmissionsPage = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'verified', 'all'
  const [verifyForm, setVerifyForm] = useState({
    submissionId: '',
    approved: true,
    comments: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messagesEndRef, setMessagesEndRef] = useState(null);
  
  // Function to fetch all data
  const fetchData = async () => {
      try {
        setLoading(true);
        const jobsRes = await axios.get('/api/jobs/verifier/assigned');
        setJobs(jobsRes.data);
        
        // Fetch submissions for each job
        const allSubmissions = [];
        for (const job of jobsRes.data) {
          const submissionsRes = await axios.get(`/api/submissions/job/${job._id}`);
          allSubmissions.push(...submissionsRes.data);
        }
        
        setSubmissions(allSubmissions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching verifier jobs:', error);
        setLoading(false);
      }
    };
    
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleVerifyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVerifyForm({
      ...verifyForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleVerifySubmit = async (submissionId) => {
    try {
      // Make API call to verify the submission
      await axios.put(`/api/submissions/${submissionId}/verify`, {
        approved: verifyForm.approved,
        comments: verifyForm.comments
      });
      
      // Refetch data to ensure we have the latest state
      await fetchData();
      
      // Reset form
      setVerifyForm({
        submissionId: '',
        approved: true,
        comments: ''
      });
      
      // Set success message
      setSuccessMessage('Verification submitted successfully!');
      
      // Switch to verified tab to show the newly verified submission
      setFilterStatus('verified');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error verifying submission:', error);
      alert('Error verifying submission: ' + error.response?.data?.message || 'Unknown error');
    }
  };
  
  // Helper function to get image data from localStorage
  const getImageFromStorage = (imageId, jobId) => {
    try {
      const storageKey = `job_images_${jobId}`;
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
  
  // Function to open the image viewer
  const openImageViewer = (dataUrl) => {
    setViewingImage(dataUrl);
  };
  
  // Function to close the image viewer
  const closeImageViewer = () => {
    setViewingImage(null);
  };
  
  // Format date in a readable way
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format chat time in a readable way
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // IMPROVED FILTERING: Filter submissions that need verification by this verifier
  const pendingSubmissions = submissions.filter(sub => {
    // Find this verifier's verification entry
    const verification = sub.verifications.find(v => v.verifier._id === user._id);
    // Consider it pending if:
    // 1. The verification exists
    // 2. The verification is not approved
    // 3. The overall submission status is not 'approved'
    return verification && !verification.approved && sub.status !== 'approved';
  });
  
  // IMPROVED FILTERING: Submissions already verified by this verifier
  const verifiedSubmissions = submissions.filter(sub => {
    // Find this verifier's verification entry
    const verification = sub.verifications.find(v => v.verifier._id === user._id);
    // Consider it verified if:
    // The verification exists AND is approved (regardless of overall submission status)
    return verification && verification.approved;
  });
  
  // All submissions this verifier is responsible for
  const allAssignedSubmissions = submissions.filter(sub => {
    return sub.verifications.some(v => v.verifier._id === user._id);
  });
  
  // Determine which submissions to display based on filter
  const displayedSubmissions = 
    filterStatus === 'pending' ? pendingSubmissions :
    filterStatus === 'verified' ? verifiedSubmissions :
    allAssignedSubmissions;
  
  // Function to open the chat modal
  const openChat = (submissionId) => {
    setActiveChat(submissionId);
    setChatOpen(true);
  };
  
  // Function to close the chat modal
  const closeChat = () => {
    setChatOpen(false);
  };
  
  // Function to send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      // Make API call to send a message
      await axios.post('/api/messages', {
        submissionId: activeChat,
        text: newMessage,
        senderId: user._id,
        senderName: user.name,
        senderRole: user.role
      });
      
      // Refetch messages
      await fetchMessages();
      
      // Reset new message
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.response?.data?.message || 'Unknown error');
    }
  };
  
  // Function to fetch messages
  const fetchMessages = async () => {
    try {
      setChatLoading(true);
      const messagesRes = await axios.get('/api/messages', {
        params: { submissionId: activeChat }
      });
      setMessages(messagesRes.data);
      setChatLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat]);
  
  useEffect(() => {
    if (messagesEndRef) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your verification tasks...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Success message toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
    <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Dashboard</h1>
          <p className="mt-1 text-gray-600">Review and verify work submissions from freelancers</p>
        </div>
        
        <div className="mt-4 md:mt-0 inline-flex bg-white rounded-lg shadow-sm overflow-hidden">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 text-sm font-medium ${
              filterStatus === 'pending' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-4 py-2 text-sm font-medium ${
              filterStatus === 'verified' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-l border-r border-gray-200`}
          >
            Verified ({verifiedSubmissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 text-sm font-medium ${
              filterStatus === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({allAssignedSubmissions.length})
          </button>
        </div>
      </div>
      
      {/* Debug information - can be removed in production */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-yellow-800 mb-2">Debug Information</h3>
        <p className="text-sm text-yellow-700">
          Pending submissions: {pendingSubmissions.length} | 
          Verified submissions: {verifiedSubmissions.length} | 
          Total submissions: {submissions.length}
        </p>
      </div>
      
      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Verification Tasks</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't been assigned as a verifier to any jobs yet. Check back later or contact a job provider to be added as a verifier.
          </p>
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : displayedSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No {filterStatus} Submissions</h2>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'pending'
              ? "You don't have any pending submissions to verify at this time."
              : filterStatus === 'verified'
                ? "You haven't verified any submissions yet."
                : "There are no submissions assigned to you for verification."}
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Submissions
            </button>
          )}
        </div>
      ) : (
              <div className="space-y-6">
          {displayedSubmissions.map(submission => {
                  // Find the associated job
                  const job = jobs.find(j => j._id === submission.job);
            // Find my verification
            const myVerification = submission.verifications.find(v => v.verifier._id === user._id);
            // Current status of this submission for this verifier
            const isPending = myVerification && !myVerification.approved && submission.status !== 'approved';
                  
                  return (
              <div key={submission._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-blue-50 p-4 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                    <h3 className="font-bold text-lg text-gray-900">
                            {job?.title || 'Unknown Job'}
                          </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{submission.freelancer?.name || 'Unknown Freelancer'}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(submission.createdAt)}</span>
                      </div>
                    </div>
                        </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      myVerification?.approved
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : isPending
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {myVerification?.approved
                        ? 'Verified'
                        : isPending
                          ? 'Pending'
                          : 'Inactive'}
                    </span>
                    
                        <Link 
                          to={`/jobs/${submission.job}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                        >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                          View Job
                        </Link>
                  </div>
                      </div>
                      
                <div className="p-6">
                  {/* Submission Content */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Submission Details
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line text-gray-700">
                      {submission.text || 'No details provided.'}
                    </div>
                      </div>
                  
                  {/* Images */}
                  {submission.images && submission.images.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Attached Images
                      </h4>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {submission.images.map((imageId, index) => {
                              // Try to get image from localStorage
                              const imageData = getImageFromStorage(imageId, submission.job);
                              
                              if (imageData && imageData.dataUrl) {
                                // If we have the image data, show the actual image
                                return (
                              <div 
                                key={index} 
                                className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white transition-all hover:shadow-md"
                                onClick={() => openImageViewer(imageData.dataUrl)}
                              >
                                <div className="aspect-square relative">
                                    <img 
                                      src={imageData.dataUrl} 
                                      alt={`Image ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded">
                                      View Full Size
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2 text-xs text-gray-500 truncate">
                                  Image {index + 1}
                                </div>
                                  </div>
                                );
                              } else {
                                // Otherwise show a placeholder
                                return (
                              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col items-center justify-center aspect-square">
                                <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                <span className="text-xs text-center text-gray-500 max-w-full truncate px-2">
                                      {typeof imageId === 'string' 
                                        ? imageId.split('-').pop() 
                                        : `Image ${index + 1}`}
                                    </span>
                                  </div>
                                );
                              }
                            })}
                      </div>
                    </div>
                  )}
                  
                  {/* Verification Status */}
                  {myVerification?.approved && (
                    <div className="mt-2 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Your Verification
                      </h4>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center text-green-800 font-medium mb-2">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Approved on {formatDate(myVerification.updatedAt || submission.updatedAt)}
                            </div>
                        
                        {myVerification.comments ? (
                          <div className="text-gray-700">
                            <strong className="text-sm text-gray-600">Your comments:</strong>
                            <p className="mt-1">{myVerification.comments}</p>
                          </div>
                        ) : (
                          <p className="text-gray-600 italic">No comments provided.</p>
                        )}
                          </div>
                        </div>
                      )}
                  
                  {/* Verification Form */}
                  {isPending && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Submit Your Verification
                      </h4>
                      
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleVerifySubmit(submission._id);
                        }}
                        className="bg-blue-50 rounded-lg p-5 border border-blue-100"
                      >
                        <div className="mb-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="approved"
                              checked={verifyForm.submissionId === submission._id ? verifyForm.approved : true}
                              onChange={(e) => {
                                setVerifyForm({
                                  submissionId: submission._id,
                                  approved: e.target.checked,
                                  comments: verifyForm.submissionId === submission._id ? verifyForm.comments : ''
                                });
                              }}
                              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-800 font-medium">
                              I approve this submission
                            </span>
                          </label>
                          <p className="text-sm text-gray-600 mt-1 ml-8">
                            By approving, you confirm that this work meets the requirements of the job.
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 font-medium mb-2" htmlFor={`comments-${submission._id}`}>
                            Verification Comments
                          </label>
                          <textarea
                            id={`comments-${submission._id}`}
                            name="comments"
                            value={verifyForm.submissionId === submission._id ? verifyForm.comments : ''}
                            onChange={handleVerifyChange}
                            onClick={() => {
                              if (verifyForm.submissionId !== submission._id) {
                                setVerifyForm({
                                  submissionId: submission._id,
                                  approved: true,
                                  comments: ''
                                });
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="4"
                            placeholder="Enter your feedback or comments about this submission..."
                          ></textarea>
                          <p className="text-sm text-gray-600 mt-1">
                            Your comments will be visible to the freelancer and job provider.
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                        <button
                          type="submit"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            {verifyForm.approved ? (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Submit Approval
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Submit Feedback
                              </>
                            )}
                        </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
                    </div>
                  );
                })}
        </div>
      )}
      
      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-3xl h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {jobs.find(j => j._id === submissions.find(s => s._id === activeChat)?.job)?.title || 'Chat'}
                </h3>
                <p className="text-sm text-blue-100 mt-0.5">
                  {submissions.find(s => s._id === activeChat)?.freelancer?.name 
                    ? `With ${submissions.find(s => s._id === activeChat)?.freelancer?.name}`
                    : 'Discussion thread'}
                </p>
              </div>
              <button 
                onClick={closeChat}
                className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                  return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${message.isSystemMessage ? 'w-full text-center' : ''}`}>
                          {message.isSystemMessage ? (
                            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                              {message.text}
                            </div>
                          ) : (
                            <>
                              <div className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold ${
                                  message.sender.role === 'freelancer'
                                    ? 'bg-blue-500'
                                    : message.sender.role === 'job_provider'
                                      ? 'bg-purple-500'
                                      : 'bg-green-500'
                                }`}>
                                  {message.sender.name.charAt(0).toUpperCase()}
                                </div>
                        <div>
                                  <div className={`rounded-lg px-4 py-2 ${
                                    isCurrentUser
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-800'
                                  }`}>
                                    {message.text}
                                  </div>
                                  <div className={`text-xs mt-1 text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                    <span className="font-medium">
                                      {isCurrentUser ? 'You' : message.sender.name}
                                    </span> · {formatChatTime(message.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
                      </div>
                      
            {/* Chat Input */}
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
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <div className="mt-2 text-xs text-gray-500">
                <p>Messages are visible to all parties involved in this job: job provider, freelancer, and verifiers.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image viewer modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeImageViewer}
        >
          <div 
            className="relative max-w-5xl max-h-screen p-2" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeImageViewer}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-lg hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={viewingImage} 
              alt="Full size preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
      
      {/* Empty state information if no submissions are assigned */}
      {jobs.length > 0 && submissions.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You've been assigned as a verifier to jobs, but there are no submissions to verify yet. 
                  When freelancers submit their work, you'll be able to review and verify it here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tips for verification */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tips for Effective Verification</h2>
        </div>
        <div className="p-6 text-sm text-gray-600">
          <ul className="space-y-2">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Review the job requirements carefully before verifying a submission.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Provide constructive feedback in your comments, especially if you find issues.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Use the chat feature to communicate directly with both the freelancer and job provider.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Be thorough in your assessment to maintain quality standards.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifySubmissionsPage;