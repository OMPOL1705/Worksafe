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
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1);
  
  const { name, email, password, confirmPassword, role, skills } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Clear error for the field being edited
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
  };
  
  const validateStep1 = () => {
    const errors = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };
  
  const prevStep = () => {
    setStep(1);
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setFormErrors({
        ...formErrors,
        confirmPassword: 'Passwords do not match'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };
  
  // Role descriptions
  const roleDescriptions = {
    freelancer: "Find projects, submit work, and earn money with your skills",
    job_provider: "Post jobs, hire freelancers, and get your projects completed",
    verifier: "Review and verify work quality to ensure project success"
  };
  
  // Sample skill suggestions based on role
  const skillSuggestions = {
    freelancer: ["Web Development", "Mobile App", "Design", "Writing", "Marketing"],
    job_provider: ["Project Management", "Communication", "Organization"],
    verifier: ["Quality Assurance", "Technical Review", "Code Review", "Content Editing"]
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  const addSkill = (skill) => {
    const currentSkills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ');
      setFormData({...formData, skills: newSkills});
    }
  };
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <p className="text-blue-100 mt-1">Join Work Safe to start your freelancing journey</p>
          </div>
          
          <div className="p-8">
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
            
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    1
                  </div>
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-500'}`}>Account</p>
                  </div>
                </div>
                
                <div className="w-12 h-1 bg-gray-200 mx-2">
                  <div className={`h-full bg-blue-600 ${step > 1 ? 'w-full' : 'w-0'} transition-all duration-300`}></div>
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    step === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    2
                  </div>
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-500'}`}>Role & Skills</p>
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={onSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="you@example.com"
                      required
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={onChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                        minLength="6"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={onChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                        minLength="6"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="role">
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['freelancer', 'job_provider', 'verifier'].map((roleOption) => (
                        <div 
                          key={roleOption}
                          onClick={() => setFormData({...formData, role: roleOption})}
                          className={`border p-4 rounded-lg cursor-pointer transition-all ${
                            role === roleOption 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <input
                              type="radio"
                              id={roleOption}
                              name="role"
                              value={roleOption}
                              checked={role === roleOption}
                              onChange={onChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={roleOption} className="ml-2 text-gray-900 font-medium capitalize">
                              {roleOption.replace('_', ' ')}
                            </label>
                          </div>
                          <p className="text-sm text-gray-600">{roleDescriptions[roleOption]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="skills">
                      Skills {role === 'freelancer' && <span className="text-sm font-normal text-gray-500">(required for freelancers)</span>}
                    </label>
                    <textarea
                      id="skills"
                      name="skills"
                      value={skills}
                      onChange={onChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. React, Node.js, Design (comma separated)"
                      rows="3"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your skills separated by commas
                    </p>
                    
                    {/* Skill suggestions */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Popular skills for {role.replace('_', ' ')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {skillSuggestions[role]?.map((skill, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg shadow-sm transition-colors"
                    >
                      Back
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`py-3 px-6 text-white font-medium rounded-lg shadow-sm transition-colors ${
                        isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </Link>
          </p>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By registering, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;