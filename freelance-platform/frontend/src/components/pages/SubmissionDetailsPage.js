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
  
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (!submission || !job) {
    return <div className="text-center py-4">Submission not found</div>;
  }
  
  // Check if user has permission to view this submission
  const isJobProvider = user._id === job.jobProvider._id;
  const isAssignedFreelancer = user._id === job.selectedFreelancer?._id;
  const isVerifier = job.verifiers.some(v => v._id === user._id);
  
  if (!isJobProvider && !isAssignedFreelancer && !isVerifier) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-red-600 mb-4">You don't have permission to view this submission.</p>
        <Link 
          to="/dashboard"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  // Find my verification if I'm a verifier
  const myVerification = isVerifier 
    ? submission.verifications.find(v => v.verifier._id === user._id) 
    : null;
  
  // Check if all verifiers have approved
  const allVerifiersApproved = submission.verifications.every(v => v.approved);
  
  return (
    <div>
      <div className="mb-6">
        <Link to={`/jobs/${job._id}`} className="text-blue-500 hover:underline">
          &larr; Back to Job
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Submission for: {job.title}</h1>
            <p className="text-gray-600">
              Submitted by {submission.freelancer.name} on {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            submission.status === 'approved' 
              ? 'bg-green-100 text-green-800' 
              : submission.status === 'rejected'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {submission.status.toUpperCase()}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Submission Details</h2>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-line">
            {submission.text}
          </div>
        </div>
        
        {submission.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Images</h2>
            <div className="flex flex-wrap gap-4">
              {submission.images.map((image, index) => (
                <div key={index} className="border p-2 rounded">
                  <p className="text-center text-sm">{image}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Verification Status</h2>
          <div className="space-y-3">
            {submission.verifications.map(verification => (
              <div key={verification._id} className="flex items-start border-b pb-3">
                <div className={`w-4 h-4 mt-1 rounded-full mr-3 ${
                  verification.approved ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">{verification.verifier.name}</p>
                  <p className="text-sm text-gray-600">
                    Status: {verification.approved ? 'Approved' : 'Pending'}
                  </p>
                  {verification.comments && (
                    <p className="text-sm mt-1">
                      Comments: {verification.comments}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {submission.status === 'approved' && allVerifiersApproved && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              All verifiers have approved this submission. The job is marked as completed.
            </p>
          </div>
        )}
      </div>
      
      {/* Verification Form for Verifiers */}
      {isVerifier && myVerification && !myVerification.approved && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Verify This Submission</h2>
          <form onSubmit={handleVerifySubmit}>
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="approved"
                  checked={verifyForm.approved}
                  onChange={handleVerifyChange}
                  className="mr-2 h-5 w-5"
                />
                <span className="text-gray-800">Approve this submission</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="comments">
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={verifyForm.comments}
                onChange={handleVerifyChange}
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
      )}
    </div>
  );
};

export default SubmissionDetailsPage;