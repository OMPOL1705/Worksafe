import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Welcome to <span className="text-yellow-300">Work Safe</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-blue-100">
            The platform that ensures secure, verified, and quality freelance work for both clients and professionals.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-50 transform hover:-translate-y-1 transition-all"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-900 transform hover:-translate-y-1 transition-all"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-50 transform hover:-translate-y-1 transition-all"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-blue-600 text-4xl font-bold mb-2">1000+</div>
              <p className="text-gray-700">Verified Projects</p>
            </div>
            <div className="p-6">
              <div className="text-blue-600 text-4xl font-bold mb-2">500+</div>
              <p className="text-gray-700">Trusted Professionals</p>
            </div>
            <div className="p-6">
              <div className="text-blue-600 text-4xl font-bold mb-2">98%</div>
              <p className="text-gray-700">Safety Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How <span className="text-blue-600">Work Safe</span> Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transform transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
                <span className="text-4xl">🧑‍💼</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Job Providers</h3>
              <p className="text-gray-600">
                Post jobs, select verified professionals, and ensure quality work through our secure verification system.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transform transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
                <span className="text-4xl">👩‍💻</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Freelancers</h3>
              <p className="text-gray-600">
                Access safe job opportunities, submit proposals with confidence, and receive guaranteed payment for verified work.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg text-center transform transition-all hover:-translate-y-2 hover:shadow-xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6">
                <span className="text-4xl">👨‍🔬</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Verifiers</h3>
              <p className="text-gray-600">
                Be our safety guardians by reviewing and validating work submissions, ensuring the highest quality standards.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Process Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">The <span className="text-blue-600">Secure Process</span></h2>
          
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-100 -translate-y-1/2"></div>
              <div className="flex justify-between relative">
                <div className="flex flex-col items-center">
                  <div className="z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    1
                  </div>
                  <p className="text-center font-medium text-lg">Job Posted</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    2
                  </div>
                  <p className="text-center font-medium text-lg">Freelancer Selected</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    3
                  </div>
                  <p className="text-center font-medium text-lg">Work Submitted</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    4
                  </div>
                  <p className="text-center font-medium text-lg">Verification</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="z-10 w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    5
                  </div>
                  <p className="text-center font-medium text-lg">Secure Payment</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile view for the process */}
          <div className="md:hidden">
            <div className="space-y-6">
              {[
                "Job Posted",
                "Freelancer Selected",
                "Work Submitted",
                "Verification",
                "Secure Payment"
              ].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">
                    {index + 1}
                  </div>
                  <p className="font-medium text-lg">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Features */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose <span className="text-blue-600">Work Safe</span>?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md flex">
              <div className="mr-4 text-blue-600">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Triple Verification</h3>
                <p className="text-gray-700">Every project goes through our unique triple verification process, ensuring quality and security for all parties.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex">
              <div className="mr-4 text-blue-600">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                <p className="text-gray-700">Funds are held in escrow until work is verified, protecting both clients and freelancers from payment issues.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex">
              <div className="mr-4 text-blue-600">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Trusted Community</h3>
                <p className="text-gray-700">Every member of our platform is vetted, creating a safe environment for collaboration and professional growth.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md flex">
              <div className="mr-4 text-blue-600">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Fast Resolution</h3>
                <p className="text-gray-700">Our verification system speeds up project completion and dispute resolution, saving you time and stress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Success <span className="text-blue-600">Stories</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-3">J</div>
                <div>
                  <h4 className="font-bold">John Doe</h4>
                  <p className="text-sm text-gray-600">Web Developer</p>
                </div>
              </div>
              <p className="text-gray-700">"Work Safe has eliminated my concerns about getting paid for my work. The verification system ensures my projects are evaluated fairly and payment is guaranteed."</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-3">S</div>
                <div>
                  <h4 className="font-bold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-600">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-700">"As someone who hires freelancers regularly, Work Safe has been a game-changer. I can trust that the work will be verified by experts before payment is released."</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl mr-3">M</div>
                <div>
                  <h4 className="font-bold">Michael Garcia</h4>
                  <p className="text-sm text-gray-600">Quality Verifier</p>
                </div>
              </div>
              <p className="text-gray-700">"Being a verifier on Work Safe allows me to use my expertise to help maintain high standards while earning additional income. It's a win-win for everyone."</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready for a Safer Work Experience?</h2>
          <p className="text-xl mb-10 text-blue-100">Join Work Safe today and discover the security of verified freelancing.</p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-50"
              >
                Create an Account
              </Link>
              <Link
                to="/login"
                className="bg-blue-800 text-white border border-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-900"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-50"
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