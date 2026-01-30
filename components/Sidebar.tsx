
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, Bell, BarChart2, Sparkles, Settings, BookOpen, Shield, ClipboardList, Table2, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Role } from '../types';

const Sidebar: React.FC = () => {
  const { currentUser } = useApp();

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
    }`;

  const isHomeroom = currentUser?.role === Role.HOMEROOM;
  const isParent = currentUser?.role === Role.PARENT;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10 hidden md:flex shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <BookOpen size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Lớp Học Số</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        
        {/* --- MENU DÀNH CHO GIÁO VIÊN --- */}
        {!isParent && (
          <>
            <div className="mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quản lý lớp</div>
            
            <NavLink to="/" className={linkClasses}>
              <LayoutDashboard size={18} />
              <span>Tổng Quan</span>
            </NavLink>
            
            <NavLink to="/students" className={linkClasses}>
              <Users size={18} />
              <span>Thông Tin Học Sinh</span>
            </NavLink>
            
            {isHomeroom && (
              <>
                <NavLink to="/attendance" className={linkClasses}>
                  <CalendarCheck size={18} />
                  <span>Điểm Danh</span>
                </NavLink>

                <NavLink to="/academic-results" className={linkClasses}>
                  <Table2 size={18} />
                  <span>Sổ Điểm Điện Tử</span>
                </NavLink>

                <NavLink to="/scorecards" className={linkClasses}>
                  <FileText size={18} />
                  <span>Phiếu Liên Lạc</span>
                </NavLink>
                
                <NavLink to="/academic" className={linkClasses}>
                  <GraduationCap size={18} />
                  <span>Kết quả HT RL</span>
                </NavLink>

                <NavLink to="/reviews" className={linkClasses}>
                  <ClipboardList size={18} />
                  <span>Nhận Xét Định Kỳ</span>
                </NavLink>
                
                <NavLink to="/notifications" className={linkClasses}>
                  <Bell size={18} />
                  <span>Thông Báo – Ghi Chú</span>
                </NavLink>
              </>
            )}
            
            <NavLink to="/reports" className={linkClasses}>
              <BarChart2 size={18} />
              <span>Báo Cáo – Thống Kê</span>
            </NavLink>

            {isHomeroom && (
              <>
                <div className="mt-8 mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quản trị</div>
                
                <NavLink to="/accounts" className={linkClasses}>
                  <Shield size={18} />
                  <span>Quản lý Tài khoản</span>
                </NavLink>

                <NavLink to="/ai-assistant" className={linkClasses}>
                  <Sparkles size={18} />
                  <span>Trợ Lý AI Gemini</span>
                </NavLink>
                
                <NavLink to="/settings" className={linkClasses}>
                  <Settings size={18} />
                  <span>Cài Đặt</span>
                </NavLink>
              </>
            )}
          </>
        )}

        {/* --- MENU DÀNH CHO PHỤ HUYNH --- */}
        {isParent && (
          <>
            <div className="mb-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sổ Liên Lạc Điện Tử</div>
            
            <NavLink to="/" className={linkClasses}>
              <Bell size={18} />
              <span>Bảng Tin & Thông Báo</span>
            </NavLink>

            <NavLink to="/scorecards" className={linkClasses}>
              <FileText size={18} />
              <span>Phiếu Liên Lạc</span>
            </NavLink>

            <NavLink to="/academic" className={linkClasses}>
              <GraduationCap size={18} />
              <span>Kết quả HT RL</span>
            </NavLink>

            <NavLink to="/reviews" className={linkClasses}>
              <ClipboardList size={18} />
              <span>Nhận Xét Định Kỳ</span>
            </NavLink>

            <NavLink to="/reports" className={linkClasses}>
              <CalendarCheck size={18} />
              <span>Thống Kê Điểm Danh</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-center text-gray-400">
          Phiên bản 1.5.0 (Parents)
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
