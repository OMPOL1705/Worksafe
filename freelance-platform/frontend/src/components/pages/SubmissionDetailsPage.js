import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const SubmissionDetailsPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyForm, setVerifyForm] = useState({
    approved: true,
    comments: ''
  });
  
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        setLoading(true);
        
        // Get submission details
        const submissionsRes = await axios.get(`/api/submissions/job`);
        const foundSubmission = submissionsRes.data.find(sub => sub._id === id);
        
        if (!foundSubmission) {
          alert('Submission not found');
          navigate('/dashboard');
          return;
        }
        
        setSubmission(foundSubmission);
        
        // Get job details
        const jobRes = await axios.get(`/api/jobs/${foundSubmission.job}`);
        setJob(jobRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submission details:', error);
        setLoading(false);
        navigate('/dashboard');
      }
    };
    
    fetchSubmissionDetails();
  }, [id, navigate]);
  
  const handleVerifyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVerifyForm({
      ...verifyForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/submissions/${id}/verify`, {
        approved: verifyForm.approved,
        comments: verifyForm.comments
      });
      
      // Refresh submission data
      const submissionsRes = await axios.get(`/api/submissions/job/${job._id}`);
      const updatedSubmission = submissionsRes.data.find(sub => sub._id === id);
      setSubmission(updatedSubmission);
      
      alert('Verification submitted successfully!');
    } catch (error) {
      console.error('Error verifying submission:', error);
      alert('Error verifying submission: ' + error.response?.data?.message || 'Unknown error');
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: (
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: (
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: (
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }
  
  if (!submission || !job) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-6">The submission you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Check if user has permission to view this submission
  const isJobProvider = user._id === job.jobProvider._id;
  const isAssignedFreelancer = user._id === job.selectedFreelancer?._id;
  const isVerifier = job.verifiers.some(v => v._id === user._id);
  
  if (!isJobProvider && !isAssignedFreelancer && !isVerifier) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-500 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8a3 3 0 00-3-3H8a3 3 0 00-3 3v1" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15h2v2h-2v-2zm0 0v-2h2v2h-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this submission. Only the job provider, assigned freelancer, or designated verifiers can access this page.</p>
          <Link 
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-7-7v14" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Find my verification if I'm a verifier
  const myVerification = isVerifier 
    ? submission.verifications.find(v => v.verifier._id === user._id) 
    : null;
  
  // Check if all verifiers have approved
  const allVerifiersApproved = submission.verifications.every(v => v.approved);
  
  // Get status badge
  const statusBadge = getStatusBadge(submission.status);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <Link 
          to={`/jobs/${job._id}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4 md:mb-0"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Job Details
        </Link>
        
        <div className={`inline-flex items-center px-3 py-1.5 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} border rounded-full text-sm font-medium`}>
          {statusBadge.icon}
          {submission.status.toUpperCase()}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{submission.freelancer.name}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Submitted on {formatDate(submission.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submission Content */}
        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-5 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submission Details
            </h2>
            <div className="text-gray-700 whitespace-pre-line">
              {submission.text || 'No details provided.'}
            </div>
          </div>
          
          {submission.images && submission.images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Submitted Images
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {submission.images.map((image, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center">
                    <div className="bg-gray-100 rounded-md p-2 w-full mb-2 flex items-center justify-center h-40">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 break-all">{image}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Verification Status */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verification Status
            </h2>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {submission.verifications.map((verification, index) => (
                <div key={verification._id} className={`${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="p-4 flex items-start">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      verification.approved 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {verification.approved ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{verification.verifier.name}</h3>
                        <span className={`text-sm ${verification.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                          {verification.approved ? 'Approved' : 'Pending Verification'}
                        </span>
                      </div>
                      
                      {verification.comments ? (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                          {verification.comments}
                        </div>
                      ) : (
                        verification.approved ? (
                          <p className="text-sm text-gray-500">No additional comments.</p>
                        ) : (
                          <p className="text-sm text-gray-500">Waiting for verification...</p>
                        )
                      )}
                      
                      {/* Highlight if this is the current user's verification */}
                      {user._id === verification.verifier._id && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">
                          This is your verification
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Submission Status Summary */}
            {submission.status === 'approved' && allVerifiersApproved && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-800">All Verifiers Have Approved</h3>
                  <p className="text-sm text-green-700 mt-1">
                    This submission has been fully verified and the job is marked as completed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Verification Form for Verifiers */}
      {isVerifier && myVerification && !myVerification.approved && (
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Verify This Submission
            </h2>
            <p className="text-gray-600 mt-1">Please review the submission and provide your verification.</p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleVerifySubmit}>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="approved"
                    checked={verifyForm.approved}
                    onChange={handleVerifyChange}
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
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="comments">
                  Verification Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={verifyForm.comments}
                  onChange={handleVerifyChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Enter your feedback, concerns, or suggestions about this submission..."
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Submit Verification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetailsPage;