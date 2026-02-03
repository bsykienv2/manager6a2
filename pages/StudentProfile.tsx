
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { User, MapPin, Phone, Briefcase, Calendar, CreditCard, Flag, Home, Heart, Users, CheckCircle2, UserCircle } from 'lucide-react';

const StudentProfile: React.FC = () => {
  const { students, currentUser, classInfo } = useApp();

  // Tìm học sinh dựa trên tài khoản phụ huynh
  const student = students.find(s => s.id === currentUser?.studentId);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
        <UserCircle size={64} className="mb-4 text-gray-300" />
        <p className="text-lg">Không tìm thấy thông tin học sinh.</p>
        <p className="text-sm">Vui lòng liên hệ giáo viên chủ nhiệm để kiểm tra liên kết tài khoản.</p>
      </div>
    );
  }

  // Định dạng ngày sinh
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Chưa cập nhật';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const InfoRow = ({ icon: Icon, label, value, isHighlight = false }: { icon: any, label: string, value?: string, isHighlight?: boolean }) => (
    <div className="flex items-start gap-3 p-2 group">
      <div className={`mt-0.5 ${isHighlight ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
          {value || 'Chưa có thông tin'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* 1. TOP BANNER & HEADER */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute bottom-4 right-6 text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
               <Home size={14} /> Lớp {classInfo.className} - NH {classInfo.schoolYear}
            </div>
        </div>

        {/* Profile Card Overlay */}
        <div className="px-6 relative -mt-16 mb-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col md:flex-row items-end md:items-center gap-6">
                {/* Avatar */}
                <div className="relative -mt-10 md:-mt-16 flex-shrink-0">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center overflow-hidden">
                        {student.avatar ? (
                            <img src={student.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-gray-400" />
                        )}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-green-500 border-2 border-white w-5 h-5 rounded-full" title="Đang học"></div>
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1 pb-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{student.fullName}</h1>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 w-fit">
                            Mã HS: {student.id}
                        </span>
                    </div>
                    <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                        {student.gender === 'Nam' ? 'Nam' : 'Nữ'} • Sinh ngày {formatDate(student.dateOfBirth)}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID (HORIZONTAL LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2 md:px-0">
          
          {/* COLUMN 1: PERSONAL DETAILS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <UserCircle className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin cá nhân</h3>
              </div>
              <div className="p-5 space-y-2">
                  <InfoRow icon={Calendar} label="Ngày sinh" value={formatDate(student.dateOfBirth)} />
                  <InfoRow icon={MapPin} label="Nơi sinh" value={student.placeOfBirth} />
                  <InfoRow icon={Flag} label="Dân tộc" value={student.ethnicity} />
                  <InfoRow icon={CreditCard} label="CCCD / Mã Định Danh" value={student.cccd} isHighlight={true} />
                  <InfoRow icon={CheckCircle2} label="Trạng thái" value={student.status === 'studying' ? 'Đang theo học' : 'Khác'} />
              </div>
          </div>

          {/* COLUMN 2: CONTACT ADDRESS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <MapPin className="text-orange-600" size={20} />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">Địa chỉ & Liên hệ</h3>
              </div>
              <div className="p-5 flex-1">
                  <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 mb-4">
                      <p className="text-xs font-bold text-orange-800 uppercase mb-2">Địa chỉ thường trú:</p>
                      <p className="text-gray-800 font-medium leading-relaxed">
                          {student.address || 'Chưa cập nhật địa chỉ chi tiết.'}
                      </p>
                  </div>
                  <div className="space-y-2">
                      <p className="text-xs text-gray-400 italic">
                          * Thông tin liên hệ chính được lấy từ Cha hoặc Mẹ trong phần thông tin gia đình.
                      </p>
                  </div>
              </div>
          </div>

          {/* COLUMN 3: FAMILY INFO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Heart className="text-pink-600" size={20} />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin gia đình</h3>
              </div>
              <div className="p-5 space-y-6">
                  {/* Father */}
                  <div className="relative pl-4 border-l-2 border-blue-200">
                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-200"></div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Họ tên Cha</h4>
                      <p className="text-lg font-bold text-blue-900 mb-1">{student.fatherName || '---'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                          <InfoRow icon={Phone} label="Điện thoại" value={student.fatherPhone} />
                          <InfoRow icon={Briefcase} label="Nghề nghiệp" value={student.fatherJob} />
                          <InfoRow icon={Calendar} label="Năm sinh" value={student.fatherYearOfBirth} />
                      </div>
                  </div>

                  {/* Mother */}
                  <div className="relative pl-4 border-l-2 border-pink-200">
                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-pink-200"></div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Họ tên Mẹ</h4>
                      <p className="text-lg font-bold text-pink-900 mb-1">{student.motherName || '---'}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                          <InfoRow icon={Phone} label="Điện thoại" value={student.motherPhone} />
                          <InfoRow icon={Briefcase} label="Nghề nghiệp" value={student.motherJob} />
                          <InfoRow icon={Calendar} label="Năm sinh" value={student.motherYearOfBirth} />
                      </div>
                  </div>

                  {/* Guardian (Only if exists) */}
                  {student.guardianName && (
                      <div className="relative pl-4 border-l-2 border-green-200">
                          <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-green-200"></div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2">Người giám hộ</h4>
                          <p className="text-lg font-bold text-green-900 mb-1">{student.guardianName}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                              <InfoRow icon={Phone} label="Điện thoại" value={student.guardianPhone} />
                              <InfoRow icon={Briefcase} label="Nghề nghiệp" value={student.guardianJob} />
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default StudentProfile;
