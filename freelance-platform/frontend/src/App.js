import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import HomePage from './components/pages/HomePage';
import RegisterPage from './components/pages/RegisterPage';
import LoginPage from './components/pages/LoginPage';
import Dashboard from './components/pages/Dashboard';
import JobListPage from './components/pages/JobListPage';
import JobDetailsPage from './components/pages/JobDetailsPage';
import CreateJobPage from './components/pages/CreateJobPage';
import ProfilePage from './components/pages/ProfilePage';
import PrivateRoute from './components/routing/PrivateRoute';
import RoleRoute from './components/routing/RoleRoute';
import VerifySubmissionsPage from './components/pages/VerifySubmissionsPage';
import MyJobsPage from './components/pages/MyJobsPage';
import SubmissionDetailsPage from './components/pages/SubmissionDetailsPage';
import axios from 'axios';

function App() {
  // Initialize axios with auth header from stored token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('App initialized with stored auth token');
    }
    
    // Configure axios baseURL to point to your backend
    axios.defaults.baseURL = 'http://localhost:5000';
    
    // Add response interceptor to handle auth errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log('Unauthorized request detected');
          // Handle token expiration or invalid token
          if (localStorage.getItem('authToken')) {
            console.log('Clearing invalid token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Optionally redirect to login
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);
  
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="container mx-auto py-8 px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/jobs" element={<JobListPage />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/submissions/:id" element={<SubmissionDetailsPage />} />
                
                <Route element={<RoleRoute role="job_provider" />}>
                  <Route path="/create-job" element={<CreateJobPage />} />
                  <Route path="/my-jobs" element={<MyJobsPage />} />
                </Route>
                
                <Route element={<RoleRoute role="freelancer" />}>
                  <Route path="/my-projects" element={<MyJobsPage />} />
                </Route>
                
                <Route element={<RoleRoute role="verifier" />}>
                  <Route path="/verify-submissions" element={<VerifySubmissionsPage />} />
                </Route>
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;