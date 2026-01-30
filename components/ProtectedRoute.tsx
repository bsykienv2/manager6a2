import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { currentUser } = useApp();

  // 1. Nếu chưa đăng nhập -> Chuyển hướng về trang Login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu đã đăng nhập nhưng Role không nằm trong danh sách cho phép
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
                <p className="text-gray-500 mb-6">Bạn không có quyền truy cập vào trang này với vai trò hiện tại.</p>
                <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Về Trang Chủ
                </a>
            </div>
        </div>
    );
  }

  // 3. Hợp lệ -> Render nội dung bên trong
  return <Outlet />;
};

export default ProtectedRoute;
