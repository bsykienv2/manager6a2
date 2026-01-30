import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { AttendanceRecord } from '../types';
import { Calendar, Save, Check, X, FileText, UserCheck, UserX, AlertCircle } from 'lucide-react';

type AttendanceStatus = 'present' | 'excused' | 'unexcused';

interface StudentAttendanceState {
  status: AttendanceStatus;
  note: string;
}

const Attendance: React.FC = () => {
  const { students, getAttendanceRecord, saveDailyAttendance } = useApp();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({});
  const [message, setMessage] = useState('');
  const [isModified, setIsModified] = useState(false);

  // Filter active students (exclude dropped_out AND transfer)
  const activeStudents = students.filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');

  useEffect(() => {
    // Load data when date changes or students load
    const record = getAttendanceRecord(date);
    const newMap: Record<string, StudentAttendanceState> = {};
    
    // Default: Everyone present, empty notes
    activeStudents.forEach(s => {
        newMap[s.id] = { status: 'present', note: '' };
    });

    // If record exists, override defaults
    if (record) {
      record.records.forEach(r => {
        if (newMap[r.studentId]) {
            newMap[r.studentId] = { 
                status: r.status, 
                note: r.note || '' 
            };
        }
      });
    }

    setAttendanceMap(newMap);
    setIsModified(false);
  }, [date, students, getAttendanceRecord]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    setIsModified(true);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
    setIsModified(true);
  };

  const handleSave = () => {
    const records: AttendanceRecord[] = Object.entries(attendanceMap).map(([studentId, data]: [string, StudentAttendanceState]) => ({
      studentId,
      status: data.status,
      note: data.note
    }));

    saveDailyAttendance({ date, records });
    setMessage('Đã lưu dữ liệu điểm danh thành công!');
    setIsModified(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // Statistics
  const stats = Object.values(attendanceMap).reduce<{ present: number; excused: number; unexcused: number }>(
    (acc, curr: StudentAttendanceState) => {
      acc[curr.status]++;
      return acc;
    },
    { present: 0, excused: 0, unexcused: 0 }
  );

  const totalAbsent = stats.excused + stats.unexcused;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Điểm Danh Ngày</h1>
           <p className="text-gray-500 mt-1 text-sm">Ghi nhận tình hình chuyên cần của học sinh.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Calendar className="text-blue-600" size={18} />
                <span className="text-gray-500 text-sm font-medium">Ngày:</span>
                <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent outline-none text-gray-800 font-bold text-sm cursor-pointer"
                />
            </div>
            <button 
                onClick={handleSave}
                disabled={!isModified && !message}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white shadow-md transition-all active:scale-95 ${
                    isModified ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
                <Save size={18} />
                Lưu lại
            </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                 <UserCheck size={24} />
             </div>
             <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold">Hiện diện</p>
                 <p className="text-2xl font-bold text-gray-800">{stats.present}</p>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
             <div className="p-3 bg-red-50 text-red-600 rounded-full">
                 <UserX size={24} />
             </div>
             <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold">Tổng vắng</p>
                 <p className="text-2xl font-bold text-gray-800">{totalAbsent}</p>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
             <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                 <FileText size={24} />
             </div>
             <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold">Có phép</p>
                 <p className="text-2xl font-bold text-orange-600">{stats.excused}</p>
             </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
             <div className="p-3 bg-red-100 text-red-700 rounded-full">
                 <AlertCircle size={24} />
             </div>
             <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold">Không phép</p>
                 <p className="text-2xl font-bold text-red-600">{stats.unexcused}</p>
             </div>
         </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {activeStudents.length > 0 ? (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                        <th className="p-4 w-16 text-center">STT</th>
                        <th className="p-4 w-64">Họ và tên</th>
                        <th className="p-4 text-center">Trạng thái điểm danh</th>
                        <th className="p-4">Ghi chú (Lý do vắng)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {activeStudents.map((student, index) => {
                        const currentStatus = attendanceMap[student.id]?.status || 'present';
                        const currentNote = attendanceMap[student.id]?.note || '';

                        return (
                            <tr key={student.id} className={`transition-colors ${currentStatus !== 'present' ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                                <td className="p-4 text-center text-gray-500 font-medium">{index + 1}</td>
                                <td className="p-4 font-bold text-gray-800">{student.fullName}</td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        {/* Present Button */}
                                        <button
                                            onClick={() => handleStatusChange(student.id, 'present')}
                                            className={`
                                                flex flex-col items-center justify-center w-20 py-2 rounded-lg border transition-all
                                                ${currentStatus === 'present' 
                                                    ? 'bg-green-100 border-green-300 text-green-700 shadow-sm font-bold' 
                                                    : 'bg-white border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600'}
                                            `}
                                        >
                                            <Check size={18} className="mb-1" />
                                            <span className="text-xs">Có mặt</span>
                                        </button>

                                        {/* Excused Button */}
                                        <button
                                            onClick={() => handleStatusChange(student.id, 'excused')}
                                            className={`
                                                flex flex-col items-center justify-center w-20 py-2 rounded-lg border transition-all
                                                ${currentStatus === 'excused' 
                                                    ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm font-bold' 
                                                    : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200 hover:text-orange-600'}
                                            `}
                                        >
                                            <FileText size={18} className="mb-1" />
                                            <span className="text-xs">Có phép</span>
                                        </button>

                                        {/* Unexcused Button */}
                                        <button
                                            onClick={() => handleStatusChange(student.id, 'unexcused')}
                                            className={`
                                                flex flex-col items-center justify-center w-24 py-2 rounded-lg border transition-all
                                                ${currentStatus === 'unexcused' 
                                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm font-bold' 
                                                    : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600'}
                                            `}
                                        >
                                            <X size={18} className="mb-1" />
                                            <span className="text-xs">Không phép</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <input 
                                        type="text" 
                                        placeholder="Nhập lý do..." 
                                        value={currentNote}
                                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                        className={`w-full p-2 text-sm border-b bg-transparent outline-none transition-colors ${
                                            currentNote ? 'border-gray-400 text-gray-800' : 'border-gray-200 text-gray-500 focus:border-blue-400'
                                        }`}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        ) : (
            <div className="p-8 text-center text-gray-500">
                Chưa có danh sách học sinh đang học. Vui lòng thêm học sinh trước.
            </div>
        )}
      </div>

      {message && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
             <Check size={20} />
             {message}
          </div>
      )}
    </div>
  );
};

export default Attendance;