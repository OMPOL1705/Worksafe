import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const RegisterPage = () => {
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'freelancer',
    skills: ''
  });
  
  const { name, email, password, confirmPassword, role, skills } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      // Parse skills into array
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      
      await register({
        name,
        email,
        password,
        role,
        skills: skillsArray
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-8 shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
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
            minLength="6"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
            minLength="6"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="freelancer">Freelancer</option>
            <option value="job_provider">Job Provider</option>
            <option value="verifier">Verifier</option>
          </select>
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
            placeholder="e.g. React, Node.js, Design"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none"
        >
          Register
        </button>
      </form>
      
      <p className="mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:text-blue-700">
          Login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;