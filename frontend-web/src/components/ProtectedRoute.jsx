import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const adminToken = localStorage.getItem('adminToken');
    const agentToken = localStorage.getItem('agentToken');

    if (requiredRole === 'admin') {
        if (!adminToken) {
            return <Navigate to="/admin/login" replace />;
        }
        return children;
    }

    if (requiredRole === 'agent') {
        if (!agentToken) {
            return <Navigate to="/login" replace />;
        }
        
        // KYC Status Enforcement
        const agentInfo = JSON.parse(localStorage.getItem('agentInfo') || '{}');
        const isKycIncomplete = agentInfo.kycStatus === 'PENDING' || agentInfo.kycStatus === 'REJECTED';
        const isOnStatusPage = window.location.pathname.includes('kyc-status');

        // If KYC is complete, don't allow them to stay on kyc-status page
        if (!isKycIncomplete && isOnStatusPage) {
            return <Navigate to="/agent/dashboard" replace />;
        }

        return children;
    }

    return children;
};

export default ProtectedRoute;
