import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const RoleRoute = ({ role }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return user.role === role ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default RoleRoute;