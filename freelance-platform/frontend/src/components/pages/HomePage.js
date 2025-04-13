import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <div>
      <div className="bg-blue-600 text-white py-16 px-4 rounded-lg mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to FreelanceHub</h1>
          <p className="text-xl mb-8">
            The platform that connects freelancers, job providers, and verifiers for successful project completion.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-5xl text-blue-500 mb-4">🧑‍💼</div>
            <h3 className="text-xl font-bold mb-2">Job Providers</h3>
            <p className="text-gray-600">
              Post jobs, select skilled freelancers, and choose verifiers to ensure quality work.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-5xl text-blue-500 mb-4">👩‍💻</div>
            <h3 className="text-xl font-bold mb-2">Freelancers</h3>
            <p className="text-gray-600">
              Find jobs that match your skills, submit competitive proposals, and get paid upon approval.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-5xl text-blue-500 mb-4">👨‍🔬</div>
            <h3 className="text-xl font-bold mb-2">Verifiers</h3>
            <p className="text-gray-600">
              Ensure quality by reviewing work submissions and providing feedback to freelancers.
            </p>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">The FreelanceHub Process</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                1
              </div>
              <p className="text-center font-medium">Job Posted</p>
            </div>
            
            <div className="hidden md:block w-20 h-0.5 bg-blue-200"></div>
            
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                2
              </div>
              <p className="text-center font-medium">Freelancer Selected</p>
            </div>
            
            <div className="hidden md:block w-20 h-0.5 bg-blue-200"></div>
            
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                3
              </div>
              <p className="text-center font-medium">Work Submitted</p>
            </div>
            
            <div className="hidden md:block w-20 h-0.5 bg-blue-200"></div>
            
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                4
              </div>
              <p className="text-center font-medium">Verification</p>
            </div>
            
            <div className="hidden md:block w-20 h-0.5 bg-blue-200"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                5
              </div>
              <p className="text-center font-medium">Payment Released</p>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Create an Account
              </Link>
              <Link
                to="/login"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;