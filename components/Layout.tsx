
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, LogOut, User } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Role } from '../types';
import ToastContainer from './Toast';
import ConfirmModal from './ConfirmModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Sử dụng Context để lấy thông tin lớp học và user
  const { classInfo, currentUser, logout } = useApp();
  
  // State cho Mobile Menu (Overlay)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State cho Desktop Sidebar Collapse (Thu gọn/Mở rộng)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <ToastContainer />
      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?"
        confirmLabel="Đăng xuất"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Sidebar Component with Collapse Props */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden md:flex" // Hiển thị dạng flex trên desktop
      />
      
      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar 
            isCollapsed={false} 
            onToggle={() => setIsMobileMenuOpen(false)} 
            className="w-64 h-full shadow-2xl" 
         />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Main Content Area - Điều chỉnh margin-left dựa trên trạng thái Sidebar */}
      <main className={`flex-1 transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>

            {/* Class Info */}
            <div className="hidden sm:flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Lớp chủ nhiệm</span>
                    <span className="text-lg font-bold text-blue-800">{classInfo.className}</span>
                </div>
                 <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-semibold uppercase">Năm học</span>
                    <span className="text-sm font-medium text-gray-700">{classInfo.schoolYear}</span>
                </div>
            </div>
             {/* Mobile only simplified header */}
             <div className="sm:hidden">
                <span className="font-bold text-gray-800">Lớp {classInfo.className}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-gray-700">{currentUser?.fullName || 'Người dùng'}</p>
                 <p className="text-xs text-gray-400">
                     {currentUser?.role === Role.HOMEROOM ? 'Giáo viên Chủ Nhiệm' : 'Giáo viên Bộ Môn'}
                 </p>
             </div>
             {currentUser?.avatar ? (
                 <img 
                    src={currentUser.avatar} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" 
                 />
             ) : (
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border border-gray-100 shadow-sm ${currentUser?.role === Role.HOMEROOM ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    <User size={20} />
                 </div>
             )}
             <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" 
                title="Đăng xuất"
             >
                 <LogOut size={20} />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
