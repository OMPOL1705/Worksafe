import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const VerifySubmissionsPage = () => {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null); // For full-size image viewing
  const [verifyForm, setVerifyForm] = useState({
    submissionId: '',
    approved: true,
    comments: ''
  });
  
  useEffect(() => {
    const fetchVerifierJobs = async () => {
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
    
    fetchVerifierJobs();
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
      await axios.put(`/api/submissions/${submissionId}/verify`, {
        approved: verifyForm.approved,
        comments: verifyForm.comments
      });
      
      // Refresh submissions
      const updatedSubmissions = [...submissions];
      const index = updatedSubmissions.findIndex(sub => sub._id === submissionId);
      
      if (index !== -1) {
        // Find the verifier entry in the submission
        const verifierIndex = updatedSubmissions[index].verifications.findIndex(
          v => v.verifier._id === user._id
        );
        
        if (verifierIndex !== -1) {
          updatedSubmissions[index].verifications[verifierIndex].approved = verifyForm.approved;
          updatedSubmissions[index].verifications[verifierIndex].comments = verifyForm.comments;
          
          // Check if all verifiers approved
          const allApproved = updatedSubmissions[index].verifications.every(v => v.approved);
          if (allApproved) {
            updatedSubmissions[index].status = 'approved';
          }
        }
        
        setSubmissions(updatedSubmissions);
      }
      
      // Reset form
      setVerifyForm({
        submissionId: '',
        approved: true,
        comments: ''
      });
      
      alert('Verification submitted successfully!');
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
  
  // Filter submissions that need verification by this verifier
  const pendingSubmissions = submissions.filter(sub => {
    const verification = sub.verifications.find(v => v.verifier._id === user._id);
    return verification && !verification.approved && sub.status !== 'approved';
  });
  
  const verifiedSubmissions = submissions.filter(sub => {
    const verification = sub.verifications.find(v => v.verifier._id === user._id);
    return verification && verification.approved;
  });
  
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Verify Submissions</h1>
      
      {jobs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">You have no jobs assigned for verification.</p>
        </div>
      ) : (
        <>
          {pendingSubmissions.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <p className="text-gray-600 text-center">No pending submissions to verify.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Pending Verifications ({pendingSubmissions.length})</h2>
              
              <div className="space-y-6">
                {pendingSubmissions.map(submission => {
                  // Find the associated job
                  const job = jobs.find(j => j._id === submission.job);
                  
                  return (
                    <div key={submission._id} className="border p-4 rounded">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {job?.title || 'Unknown Job'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Submitted by: {submission.freelancer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(submission.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Link 
                          to={`/jobs/${submission.job}`}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm"
                        >
                          View Job
                        </Link>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Submission Details:</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{submission.text}</p>
                      </div>
                      
                      {/* Updated image display */}
                      {submission.images && submission.images.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Images:</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {submission.images.map((imageId, index) => {
                              // Try to get image from localStorage
                              const imageData = getImageFromStorage(imageId, submission.job);
                              
                              if (imageData && imageData.dataUrl) {
                                // If we have the image data, show the actual image
                                return (
                                  <div key={index} className="relative group cursor-pointer" onClick={() => openImageViewer(imageData.dataUrl)}>
                                    <img 
                                      src={imageData.dataUrl} 
                                      alt={`Image ${index + 1}`}
                                      className="h-32 w-32 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1">
                                      Click to view
                                    </div>
                                  </div>
                                );
                              } else {
                                // Otherwise show a placeholder
                                return (
                                  <div key={index} className="flex flex-col items-center p-3 bg-gray-100 rounded">
                                    <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span className="text-xs text-gray-500 w-24 truncate text-center">
                                      {typeof imageId === 'string' 
                                        ? imageId.split('-').pop() 
                                        : `Image ${index + 1}`}
                                    </span>
                                  </div>
                                );
                              }
                            })}
                            
                            {/* Display helpful message if images don't appear */}
                            <div className="w-full mt-2 text-xs text-amber-600">
                              <p>Note: Images may not appear if they were uploaded from a different browser or if local storage was cleared.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleVerifySubmit(submission._id);
                        }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="mb-4">
                          <label className="flex items-center cursor-pointer">
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
                              className="mr-2 h-5 w-5"
                            />
                            <span className="text-gray-800">Approve this submission</span>
                          </label>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2" htmlFor={`comments-${submission._id}`}>
                            Comments
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
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows="3"
                            placeholder="Enter your feedback or comments..."
                          ></textarea>
                        </div>
                        
                        <button
                          type="submit"
                          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none"
                        >
                          Submit Verification
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {verifiedSubmissions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Verified Submissions ({verifiedSubmissions.length})</h2>
              
              <div className="space-y-4">
                {verifiedSubmissions.map(submission => {
                  // Find the associated job
                  const job = jobs.find(j => j._id === submission.job);
                  // Find my verification
                  const myVerification = submission.verifications.find(v => v.verifier._id === user._id);
                  
                  return (
                    <div key={submission._id} className="border p-4 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {job?.title || 'Unknown Job'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Submitted by: {submission.freelancer.name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-sm rounded ${
                          myVerification.approved 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {myVerification.approved ? 'APPROVED' : 'REJECTED'}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="font-medium text-sm">Your Comments:</p>
                        <p className="text-gray-700 text-sm italic">
                          {myVerification.comments || 'No comments provided.'}
                        </p>
                      </div>
                      
                      <Link 
                        to={`/jobs/${submission.job}`}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        View Job Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Image viewer modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeImageViewer}
        >
          <div 
            className="relative max-w-4xl max-h-screen p-2" 
            onClick={(e) => e.stopPropagation()}
          >
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
    </div>
  );
};

export default VerifySubmissionsPage;