import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold flex items-center">
            <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span>Work Safe</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            {user ? (
              <>
                <div className="mr-6 bg-blue-500 px-3 py-2 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-1 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="font-medium">${user.balance?.toFixed(2)}</span>
                </div>
                
                <Link to="/dashboard" className="mx-2 px-3 py-2 hover:bg-blue-700 rounded-md transition-colors duration-200">
                  Dashboard
                </Link>
                
                {user.role === 'job_provider' && (
                  <Link to="/create-job" className="mx-2 px-3 py-2 hover:bg-blue-700 rounded-md transition-colors duration-200">
                    Post Job
                  </Link>
                )}
                
                <Link to="/jobs" className="mx-2 px-3 py-2 hover:bg-blue-700 rounded-md transition-colors duration-200">
                  Jobs
                </Link>
                
                <Link to="/profile" className="mx-2 px-3 py-2 hover:bg-blue-700 rounded-md transition-colors duration-200 flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Profile
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="ml-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md transition-colors duration-200 flex items-center font-medium"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mx-2 px-4 py-2 hover:bg-blue-700 rounded-md transition-colors duration-200">
                  Login
                </Link>
                <Link to="/register" className="mx-2 bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 font-medium">
                  Register
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-4 bg-blue-700">
          {user ? (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-md bg-blue-800 flex justify-between items-center">
                <span className="font-medium">Balance</span>
                <span className="font-medium">${user.balance?.toFixed(2)}</span>
              </div>
              
              <Link 
                to="/dashboard" 
                className="block px-3 py-2 rounded-md hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              {user.role === 'job_provider' && (
                <Link 
                  to="/create-job" 
                  className="block px-3 py-2 rounded-md hover:bg-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post Job
                </Link>
              )}
              
              <Link 
                to="/jobs" 
                className="block px-3 py-2 rounded-md hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </Link>
              
              <Link 
                to="/profile" 
                className="block px-3 py-2 rounded-md hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link 
                to="/login" 
                className="block px-3 py-2 rounded-md hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              
              <Link 
                to="/register" 
                className="block px-3 py-2 rounded-md bg-white text-blue-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;