import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserMinus, Bell, FileEdit, Calendar, Save, ArrowRight, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Link, useNavigate } from 'react-router-dom';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number | React.ReactNode; 
  subtext?: string | React.ReactNode;
  icon: React.ReactNode; 
  colorClass: string 
}> = ({ title, value, subtext, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.01]">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
    <div className={`p-4 rounded-xl ${colorClass}`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Lấy dữ liệu từ Context
  const { students, getAttendanceRecord, notifications, dashboardNote, updateDashboardNote } = useApp();
  
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, isAttendanceTaken: false });
  const [quickNote, setQuickNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    // Filter active students only (for accurate stats)
    const activeStudents = students.filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');

    // 1. Tính toán thống kê từ dữ liệu Context
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecord = getAttendanceRecord(today);
    
    let present = 0;
    let absent = 0;
    let isTaken = false;

    if (attendanceRecord) {
        isTaken = true;
        // Only count active students present/absent today
        attendanceRecord.records.forEach(r => {
            // Check if student is still active
            if (activeStudents.some(s => s.id === r.studentId)) {
                if (r.status === 'present') present++;
                if (r.status === 'excused' || r.status === 'unexcused') absent++;
            }
        });
    }

    setStats({
        total: activeStudents.length,
        present,
        absent,
        isAttendanceTaken: isTaken
    });

    // 2. Load Quick Note từ Context
    setQuickNote(dashboardNote);
  }, [students, getAttendanceRecord, dashboardNote]); // Chạy lại khi data thay đổi

  const handleSaveNote = () => {
      setIsSavingNote(true);
      updateDashboardNote(quickNote); // Gọi action update
      setTimeout(() => setIsSavingNote(false), 800);
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });

  // Lấy 3 thông báo mới nhất
  const sortedNotifs = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  const getTypeStyle = (type: string) => {
    switch(type) {
        case 'urgent': return 'bg-red-50 text-red-600 border-red-100';
        case 'warning': return 'bg-orange-50 text-orange-600 border-orange-100';
        default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Bảng Tin Lớp Học</h1>
           <p className="text-gray-500 flex items-center gap-2 mt-1">
             <Calendar size={16} />
             {todayStr}
           </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Tổng sĩ số" 
          value={stats.total} 
          icon={<Users size={28} className="text-blue-600" />} 
          colorClass="bg-blue-50"
        />
        <StatCard 
          title="Đi học hôm nay" 
          value={
              stats.isAttendanceTaken ? (
                  stats.present
              ) : (
                 <span className="text-gray-300">-</span>
              )
          } 
          subtext={
              stats.isAttendanceTaken ? (
                  `${stats.present}/${stats.total} học sinh`
              ) : (
                  <button 
                    onClick={() => navigate('/attendance')}
                    className="flex items-center gap-1 text-red-600 font-bold hover:underline bg-red-50 px-2 py-1 rounded border border-red-100 mt-1"
                  >
                     Điểm danh ngay <ChevronRight size={12} />
                  </button>
              )
          }
          icon={<UserCheck size={28} className={stats.isAttendanceTaken ? "text-green-600" : "text-gray-300"} />} 
          colorClass={stats.isAttendanceTaken ? "bg-green-50" : "bg-gray-100"}
        />
        <StatCard 
          title="Vắng hôm nay" 
          value={stats.isAttendanceTaken ? stats.absent : <span className="text-gray-300">-</span>}
          subtext={
            stats.isAttendanceTaken ? (
                stats.absent > 0 ? <span className="text-orange-600 font-medium">Cần liên hệ phụ huynh</span> : "Đầy đủ"
            ) : "Chưa có dữ liệu"
          } 
          icon={<UserMinus size={28} className={stats.isAttendanceTaken ? "text-red-600" : "text-gray-300"} />} 
          colorClass={stats.isAttendanceTaken ? "bg-red-50" : "bg-gray-100"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Bell size={20} className="text-indigo-600" />
                    Thông báo mới nhất
                </h3>
                <Link to="/notifications" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Xem tất cả <ArrowRight size={16} />
                </Link>
            </div>
            
            <div className="space-y-4">
                {sortedNotifs.length > 0 ? (
                    sortedNotifs.map(note => (
                        <div key={note.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                             <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${note.type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <Bell size={20} />
                                </div>
                             </div>
                             <div className="flex-1">
                                 <div className="flex justify-between items-start mb-1">
                                     <h4 className="font-bold text-gray-900">{note.title}</h4>
                                     <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getTypeStyle(note.type)}`}>
                                        {note.type === 'urgent' ? 'Khẩn cấp' : note.type === 'warning' ? 'Lưu ý' : 'Tin tức'}
                                     </span>
                                 </div>
                                 <p className="text-sm text-gray-600 line-clamp-2 mb-2">{note.content}</p>
                                 <div className="flex justify-between items-center text-xs text-gray-400">
                                     <span>{new Date(note.date).toLocaleDateString('vi-VN')}</span>
                                     <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                        {note.category === 'personal' ? 'Cá nhân' : 'Chung'}
                                     </span>
                                 </div>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                        Chưa có thông báo nào gần đây.
                    </div>
                )}
            </div>
        </div>

        {/* Quick Note Column (1/3) */}
        <div className="lg:col-span-1">
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm h-full flex flex-col p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-200 to-transparent opacity-50 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                        <FileEdit size={20} />
                        Ghi chú nhanh
                    </h3>
                    <button 
                        onClick={handleSaveNote}
                        className={`p-2 rounded-lg transition-all ${isSavingNote ? 'bg-green-500 text-white' : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'}`}
                        title="Lưu ghi chú"
                    >
                        <Save size={18} />
                    </button>
                </div>

                <textarea 
                    className="flex-1 w-full bg-transparent border-0 resize-none outline-none text-gray-800 placeholder-yellow-800/50 leading-relaxed font-medium text-sm"
                    placeholder="Viết ghi chú nhanh cho giáo viên tại đây (Ví dụ: Nhắc em An nộp tiền học, Chuẩn bị tài liệu họp...)"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    onBlur={handleSaveNote}
                ></textarea>

                <div className="mt-4 pt-4 border-t border-yellow-200/50 text-xs text-yellow-700 font-medium text-right">
                    {isSavingNote ? 'Đã lưu!' : 'Tự động lưu khi nhập xong'}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;