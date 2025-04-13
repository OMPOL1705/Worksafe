import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold">
            FreelanceHub
          </Link>
          
          <div className="flex items-center">
            {user ? (
              <>
                <span className="mr-4">
                  Balance: ${user.balance?.toFixed(2)}
                </span>
                
                <Link to="/dashboard" className="mx-2 hover:text-blue-200">
                  Dashboard
                </Link>
                
                {user.role === 'job_provider' && (
                  <Link to="/create-job" className="mx-2 hover:text-blue-200">
                    Post Job
                  </Link>
                )}
                
                <Link to="/jobs" className="mx-2 hover:text-blue-200">
                  Jobs
                </Link>
                
                <Link to="/profile" className="mx-2 hover:text-blue-200">
                  Profile
                </Link>
                
                <button
                  onClick={logout}
                  className="ml-4 bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mx-2 hover:text-blue-200">
                  Login
                </Link>
                <Link to="/register" className="mx-2 hover:text-blue-200">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;