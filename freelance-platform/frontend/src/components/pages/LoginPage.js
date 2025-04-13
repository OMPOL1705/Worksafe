import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const LoginPage = () => {
  const { login, error, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loginStatus, setLoginStatus] = useState('');
  
  const { email, password } = formData;
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setLoginStatus('Logging in...');
    
    try {
      await login(email, password);
      
      // Check if token was saved
      const token = localStorage.getItem('authToken');
      if (token) {
        setLoginStatus('Login successful! Redirecting...');
        navigate('/dashboard');
      } else {
        setLoginStatus('Error: Token not saved. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginStatus(`Login failed: ${err.message}`);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-8 shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      {loginStatus && (
        <div className={`p-3 mb-4 rounded ${
          loginStatus.includes('successful') 
            ? 'bg-green-100 text-green-700'
            : loginStatus.includes('Logging in') 
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}>
          {loginStatus}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
        >
          Login
        </button>
      </form>
      
      <div className="mt-4">
        <button 
          onClick={() => {
            const testToken = 'test_token_' + Date.now();
            localStorage.setItem('authToken', testToken);
            alert(`Test token set: ${testToken}`);
          }}
          className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 focus:outline-none mb-2"
        >
          Create Test Token
        </button>
        
        <p className="text-xs text-gray-500 mb-4 text-center">
          Use this button during development to create a test token
        </p>
      </div>
      
      <p className="mt-4 text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:text-blue-700">
          Register
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;