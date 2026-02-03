
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, GraduationCap, Bell, BarChart2, Sparkles, Settings, BookOpen, Shield, ClipboardList, Table2, FileText, Menu, ChevronLeft, UserCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Role } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, className = '' }) => {
  const { currentUser } = useApp();

  const isHomeroom = currentUser?.role === Role.HOMEROOM;
  const isParent = currentUser?.role === Role.PARENT;

  // Helper component for Sidebar Items with custom colors
  const SidebarItem = ({ to, icon: Icon, label, colorClass }: { to: string, icon: any, label: string, colorClass: string }) => (
    <NavLink 
      to={to}
      className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
        isCollapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-blue-50'
      }`}
      title={isCollapsed ? label : ""}
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : colorClass}`} />
          {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <aside 
      className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-20 transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Header Sidebar */}
      <div className={`p-4 border-b border-gray-100 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-300 ${isCollapsed ? 'justify-center h-16' : 'justify-between h-16'}`}>
        
        {/* Logo & Title - Ẩn khi thu gọn */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight animate-fade-in">Lớp Học Số</span>
          </div>
        )}

        {/* Nút Toggle (3 dấu gạch ngang / Chevron) */}
        <button 
          onClick={onToggle}
          className={`text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors ${isCollapsed ? '' : ''}`}
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? <Menu size={24} /> : <Menu size={24} />} 
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* --- MENU DÀNH CHO GIÁO VIÊN --- */}
        {!isParent && (
          <>
            {!isCollapsed && <div className="mb-2 mt-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider animate-fade-in">Quản lý lớp</div>}
            
            <SidebarItem to="/" icon={LayoutDashboard} label="Tổng Quan" colorClass="text-sky-600" />
            <SidebarItem to="/students" icon={Users} label="Thông Tin Học Sinh" colorClass="text-emerald-600" />
            
            {isHomeroom && (
              <>
                <SidebarItem to="/attendance" icon={CalendarCheck} label="Điểm Danh" colorClass="text-orange-600" />
                <SidebarItem to="/academic-results" icon={Table2} label="Sổ Điểm Điện Tử" colorClass="text-indigo-600" />
                <SidebarItem to="/scorecards" icon={FileText} label="Phiếu Liên Lạc" colorClass="text-teal-600" />
                <SidebarItem to="/academic" icon={GraduationCap} label="Kết quả HT RL" colorClass="text-blue-600" />
                <SidebarItem to="/reviews" icon={ClipboardList} label="Nhận Xét Định Kỳ" colorClass="text-pink-600" />
                <SidebarItem to="/notifications" icon={Bell} label="Thông Báo – Ghi Chú" colorClass="text-red-600" />
              </>
            )}
            
            <SidebarItem to="/reports" icon={BarChart2} label="Báo Cáo – Thống Kê" colorClass="text-cyan-600" />

            {isHomeroom && (
              <>
                {!isCollapsed ? (
                  <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider animate-fade-in">Quản trị</div>
                ) : (
                  <div className="my-2 border-t border-gray-100"></div>
                )}
                
                <SidebarItem to="/accounts" icon={Shield} label="Quản lý Tài khoản" colorClass="text-slate-600" />
                <SidebarItem to="/ai-assistant" icon={Sparkles} label="Trợ Lý AI Gemini" colorClass="text-violet-600" />
                <SidebarItem to="/settings" icon={Settings} label="Cài Đặt" colorClass="text-gray-600" />
              </>
            )}
          </>
        )}

        {/* --- MENU DÀNH CHO PHỤ HUYNH --- */}
        {isParent && (
          <>
            {!isCollapsed && <div className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sổ Liên Lạc Điện Tử</div>}
            
            <SidebarItem to="/" icon={Bell} label="Bảng Tin & Thông Báo" colorClass="text-blue-600" />
            <SidebarItem to="/student-profile" icon={UserCircle} label="Thông Tin Học Sinh" colorClass="text-emerald-600" />
            <SidebarItem to="/scorecards" icon={FileText} label="Phiếu Liên Lạc" colorClass="text-teal-600" />
            <SidebarItem to="/academic" icon={GraduationCap} label="Kết quả HT RL" colorClass="text-indigo-600" />
            <SidebarItem to="/reviews" icon={ClipboardList} label="Nhận Xét Định Kỳ" colorClass="text-pink-600" />
            <SidebarItem to="/reports" icon={CalendarCheck} label="Thống Kê Điểm Danh" colorClass="text-orange-600" />
          </>
        )}
      </nav>

      {/* Footer Version */}
      <div className={`p-4 border-t border-gray-100 bg-gray-50/50 transition-all ${isCollapsed ? 'flex justify-center' : ''}`}>
        {!isCollapsed ? (
          <p className="text-xs text-center text-gray-400">
            Phiên bản 1.5.0
          </p>
        ) : (
          <span className="text-[10px] text-gray-400 font-bold">v1.5</span>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
