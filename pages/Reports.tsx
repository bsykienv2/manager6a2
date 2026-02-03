
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Gender, Role, Student } from '../types';
import { TrendingUp, Users, Award, CalendarCheck, Printer, FileSpreadsheet, Download, BarChart2, CheckCircle2, Filter, AlertCircle, FileText, Trophy } from 'lucide-react';
import { exportToExcel } from '../services/exportService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';

const Reports: React.FC = () => {
  // 1. Lấy dữ liệu từ Context
  const { students, attendanceHistory, classInfo, currentUser } = useApp();

  // State: Chọn kỳ học để thống kê
  const [selectedTerm, setSelectedTerm] = useState<'HK1' | 'HK2' | 'CN'>('HK1');

  const isParent = currentUser?.role === Role.PARENT;

  // --- PHẦN TÍNH TOÁN SỐ LIỆU TỔNG QUAN (Chỉ tính học sinh ĐANG HỌC) ---
  const activeStudents = useMemo<Student[]>(() => {
      let list = students.filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');
      // If Parent, filter to ONLY their child
      if (isParent && currentUser?.studentId) {
          list = list.filter(s => s.id === currentUser.studentId);
      }
      return list;
  }, [students, isParent, currentUser]);
  
  const total: number = activeStudents.length; 
  const male: number = activeStudents.filter(s => s.gender === Gender.MALE).length;
  const female: number = activeStudents.filter(s => s.gender === Gender.FEMALE).length;
  
  // TÍNH TOÁN THỐNG KÊ HỌC TẬP & RÈN LUYỆN DỰA TRÊN KỲ ĐƯỢC CHỌN
  const stats = useMemo(() => {
    const academic = { Tốt: 0, Khá: 0, Đạt: 0, 'Chưa đạt': 0 };
    const conduct = { Tốt: 0, Khá: 0, Đạt: 0, 'Chưa đạt': 0 }; // Rèn luyện
    const awards: Record<string, number> = {}; // Danh hiệu

    activeStudents.forEach(s => {
        const termData = s.transcript?.[selectedTerm];
        const rank = termData?.academicRank;
        if (rank === 'Tốt') academic['Tốt']++;
        else if (rank === 'Khá') academic['Khá']++;
        else if (rank === 'Đạt') academic['Đạt']++;
        else if (rank === 'Chưa đạt') academic['Chưa đạt']++;

        const rl = termData?.conduct;
        if (rl === 'Tốt') conduct['Tốt']++;
        else if (rl === 'Khá') conduct['Khá']++;
        else if (rl === 'Đạt' || rl === 'Trung bình') conduct['Đạt']++;
        else if (rl === 'Chưa đạt' || rl === 'Yếu') conduct['Chưa đạt']++;

        // Thống kê danh hiệu
        const aw = termData?.award;
        if (aw && aw !== 'Không có' && aw.trim() !== '') {
            awards[aw] = (awards[aw] || 0) + 1;
        }
    });

    return { academic, conduct, awards };
  }, [activeStudents, selectedTerm]);

  // --- DATA FOR CHARTS --- (Only for Teachers)
  const trendData = useMemo(() => {
      if (isParent) return [];
      return [...attendanceHistory]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14)
        .map(day => {
            const presentCount = day.records.filter(r => r.status === 'present' && activeStudents.some(s => s.id === r.studentId)).length;
            const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
            return {
                date: new Date(day.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}),
                fullDate: new Date(day.date).toLocaleDateString('vi-VN'),
                rate: rate
            };
        });
  }, [attendanceHistory, total, activeStudents, isParent]);

  const topAbsentData = useMemo(() => {
      if (isParent) return [];
      const result = activeStudents.map(s => {
          let excused = 0;
          let unexcused = 0;
          attendanceHistory.forEach(day => {
              const r = day.records.find(rec => rec.studentId === s.id);
              if (r?.status === 'excused') excused++;
              if (r?.status === 'unexcused') unexcused++;
          });
          return {
              name: s.fullName, 
              shortName: s.fullName.split(' ').slice(-2).join(' '),
              excused,
              unexcused,
              totalAbsent: excused + unexcused
          };
      });

      return result
        .filter(s => s.totalAbsent > 0)
        .sort((a, b) => b.totalAbsent - a.totalAbsent)
        .slice(0, 5);
  }, [activeStudents, attendanceHistory, isParent]);


  // --- DATA FOR TABLE (Combined for Parent/Teacher) ---
  const totalSchoolDays = attendanceHistory.length; 
  const studentAttendanceStats = activeStudents.map(student => {
    let present = 0;   
    let excused = 0;   
    let unexcused = 0; 
    const detailRecords: { date: string, status: string, note?: string }[] = [];

    attendanceHistory.forEach(day => {
      const record = day.records.find(r => r.studentId === student.id);
      if (record) {
        if (record.status === 'present') present++;
        else {
            if (record.status === 'excused') excused++;
            else if (record.status === 'unexcused') unexcused++;
            // Collect absent details for Parent View
            if (isParent) {
                detailRecords.push({
                    date: day.date,
                    status: record.status === 'excused' ? 'Có phép' : 'Không phép',
                    note: record.note
                });
            }
        }
      }
    });

    const attendanceRate = totalSchoolDays > 0 ? Math.round((present / totalSchoolDays) * 100) : 0;
    return { ...student, present, excused, unexcused, attendanceRate, detailRecords };
  });

  const handlePrint = () => {
      window.print();
  };

  const handleExcelExport = () => {
      exportToExcel(activeStudents, attendanceHistory, [], classInfo);
  };

  const termLabel = selectedTerm === 'CN' ? 'Cả năm' : selectedTerm === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2';

  // --- PARENT VIEW SPECIFIC RENDER ---
  if (isParent && activeStudents.length > 0) {
      const student = studentAttendanceStats[0]; // Assume 1 child
      return (
          <div className="space-y-6">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600"><CalendarCheck size={28} /></div>
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900">Thống Kê Điểm Danh</h1>
                      <p className="text-gray-500">Chi tiết chuyên cần của {student.fullName}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 font-medium mb-1">Tổng số ngày học</p>
                          <p className="text-3xl font-bold text-gray-900">{totalSchoolDays}</p>
                      </div>
                      <div className="text-blue-600"><CalendarCheck size={32}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 font-medium mb-1">Hiện diện</p>
                          <p className="text-3xl font-bold text-green-600">{student.present}</p>
                      </div>
                      <div className="text-green-600"><CheckCircle2 size={32}/></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                      <div>
                          <p className="text-gray-500 font-medium mb-1">Vắng</p>
                          <p className="text-3xl font-bold text-red-600">{student.excused + student.unexcused}</p>
                          <p className="text-xs text-gray-400 mt-1">({student.excused} CP - {student.unexcused} KP)</p>
                      </div>
                      <div className="text-red-600"><AlertCircle size={32}/></div>
                  </div>
              </div>

              {/* Detailed Absence Log */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <FileText size={18} /> Nhật ký vắng nghỉ
                      </h3>
                  </div>
                  {student.detailRecords && student.detailRecords.length > 0 ? (
                      <table className="w-full text-left border-collapse text-sm">
                          <thead>
                              <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                                  <th className="p-4 w-12 text-center">STT</th>
                                  <th className="p-4">Ngày</th>
                                  <th className="p-4">Loại nghỉ</th>
                                  <th className="p-4">Lý do / Ghi chú</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {student.detailRecords.map((rec, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                      <td className="p-4 text-center text-gray-500 font-medium">{idx + 1}</td>
                                      <td className="p-4 font-medium text-gray-800">{new Date(rec.date).toLocaleDateString('vi-VN')}</td>
                                      <td className="p-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${rec.status === 'Có phép' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                              {rec.status}
                                          </span>
                                      </td>
                                      <td className="p-4 text-gray-600 italic">{rec.note || 'Không có ghi chú'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <div className="p-8 text-center text-gray-500 italic">
                          Học sinh đi học đầy đủ, chưa có ghi nhận vắng nghỉ.
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-10">
       {/* ... (Keep existing Header for Print) ... */}
       <div className="print-only mb-8">
            <div className="flex justify-between items-start">
                <div className="text-center">
                    <h3 className="font-bold uppercase text-sm">Phòng GD&ĐT ....................</h3>
                    <h3 className="font-bold uppercase text-sm">Trường THCS Tân Lập</h3>
                    <div className="border-t border-black w-24 mx-auto mt-1"></div>
                </div>
                <div className="text-center">
                    <h3 className="font-bold uppercase text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <h4 className="font-bold text-xs underline">Độc lập - Tự do - Hạnh phúc</h4>
                </div>
            </div>
            <div className="text-center mt-8 mb-6">
                <h1 className="text-2xl font-bold uppercase">BÁO CÁO TỔNG HỢP LỚP {classInfo.className}</h1>
                <p className="italic text-sm">Năm học: {classInfo.schoolYear} - Kỳ: {termLabel}</p>
                <p className="italic text-sm">Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
       </div>

       {/* --- TOOLBAR (Teachers Only) --- */}
       {!isParent && (
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
               <div>
                   <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê</h1>
                   <p className="text-gray-500 mt-1">Tổng hợp kết quả học tập, rèn luyện và chuyên cần.</p>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                   {/* Term Filter */}
                   <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <Filter size={16} className="text-gray-500" />
                        <select 
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value as any)}
                            className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer"
                        >
                            <option value="HK1">Học Kỳ 1</option>
                            <option value="HK2">Học Kỳ 2</option>
                            <option value="CN">Cả Năm</option>
                        </select>
                   </div>

                   <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                   <button 
                        onClick={handleExcelExport}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm font-medium text-sm"
                   >
                       <FileSpreadsheet size={18} /> Xuất Excel
                   </button>
                   <button 
                        onClick={handlePrint}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-sm font-medium text-sm"
                   >
                       <Printer size={18} /> In Báo Cáo
                   </button>
               </div>
           </div>
       )}

       {/* General Overview Cards (Teachers Only) */}
       {!isParent && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
               {/* Thống kê Giới tính */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
                       <h3 className="font-semibold text-gray-700">Giới tính</h3>
                   </div>
                   <div className="mt-4 space-y-3">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-gray-600">Tổng số</span>
                           <span className="font-bold text-lg">{total}</span>
                       </div>
                       <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                           <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                       </div>
                       <div className="flex justify-between text-xs text-gray-500">
                            <span>Nam: <b>{male}</b></span>
                            <span>Nữ: <b>{female}</b></span>
                       </div>
                       <div className="flex w-full h-1.5 rounded-full overflow-hidden">
                           <div className="bg-blue-400 h-full" style={{ width: `${total > 0 ? (male/total)*100 : 0}%` }}></div>
                           <div className="bg-pink-400 h-full" style={{ width: `${total > 0 ? (female/total)*100 : 0}%` }}></div>
                       </div>
                   </div>
               </div>

               {/* Thống kê Học lực */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                            <h3 className="font-semibold text-gray-700">Học lực ({selectedTerm})</h3>
                        </div>
                   </div>
                    <div className="space-y-3">
                       {['Tốt', 'Khá', 'Đạt', 'Chưa đạt'].map((label) => {
                           const count = stats.academic[label as keyof typeof stats.academic];
                           const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                           let color = 'bg-green-500';
                           if (label === 'Khá') color = 'bg-blue-500';
                           if (label === 'Đạt') color = 'bg-orange-500';
                           if (label === 'Chưa đạt') color = 'bg-red-500';

                           return (
                               <div key={label}>
                                   <div className="flex justify-between items-end mb-1">
                                       <span className="text-xs font-medium text-gray-600">{label}</span>
                                       <span className="text-xs font-bold">{count} <span className="text-gray-400 font-normal">({percent}%)</span></span>
                                   </div>
                                   <div className="w-full bg-gray-100 rounded-full h-1.5">
                                       <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percent}%` }}></div>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>

                {/* Thống kê Rèn luyện */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Award size={20} /></div>
                           <h3 className="font-semibold text-gray-700">Kết quả Rèn luyện</h3>
                       </div>
                   </div>
                   <div className="space-y-3">
                       {['Tốt', 'Khá', 'Đạt', 'Chưa đạt'].map((label) => {
                           const count = stats.conduct[label as keyof typeof stats.conduct];
                           const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                           let color = 'bg-purple-500';
                           if (label === 'Khá') color = 'bg-indigo-500';
                           if (label === 'Đạt') color = 'bg-yellow-500';
                           if (label === 'Chưa đạt') color = 'bg-gray-500';

                           return (
                               <div key={label}>
                                   <div className="flex justify-between items-end mb-1">
                                       <span className="text-xs font-medium text-gray-600">{label}</span>
                                       <span className="text-xs font-bold">{count} <span className="text-gray-400 font-normal">({percent}%)</span></span>
                                   </div>
                                   <div className="w-full bg-gray-100 rounded-full h-1.5">
                                       <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percent}%` }}></div>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>

                {/* Thống kê Danh hiệu thi đua (NEW) */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Trophy size={20} /></div>
                           <h3 className="font-semibold text-gray-700">Danh hiệu thi đua</h3>
                       </div>
                   </div>
                   <div className="space-y-4 overflow-y-auto max-h-[220px]">
                       {Object.keys(stats.awards).length > 0 ? (
                            Object.entries(stats.awards).map(([awardName, count]) => {
                                // FIX: Use Number(count) to avoid TS error
                                const percent = total > 0 ? ((Number(count) / total) * 100).toFixed(0) : 0;
                                return (
                                    <div key={awardName}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]" title={awardName}>{awardName}</span>
                                            <span className="text-xs font-bold">{count} <span className="text-gray-400 font-normal">({percent}%)</span></span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                                <Trophy size={32} className="opacity-20 mb-2" />
                                <span className="text-xs italic">Chưa có danh hiệu nào</span>
                           </div>
                       )}
                   </div>
               </div>
               
               {/* Download Tip (Optional: Can remove or keep if needed) */}
               {/* Hidden for space or moved below charts */}
           </div>
       )}

       {/* --- CHARTS SECTION (Web Only - Teachers Only) --- */}
       {!isParent && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                {/* Chart 1: Attendance Trends */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CalendarCheck size={20} className="text-blue-600" />
                            <h3 className="font-bold text-gray-800">Biểu đồ Tỷ lệ Chuyên cần</h3>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">14 ngày gần nhất</span>
                    </div>
                    <div className="h-[300px] w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, 'Tỷ lệ']}
                                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="rate" 
                                        stroke="#2563eb" 
                                        fillOpacity={1} 
                                        fill="url(#colorRate)" 
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">Chưa có dữ liệu điểm danh</div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Top Absence */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart2 size={20} className="text-red-500" />
                            <h3 className="font-bold text-gray-800">Top học sinh vắng nhiều</h3>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {topAbsentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topAbsentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" fontSize={12} hide />
                                    <YAxis dataKey="shortName" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{fill: '#f9fafb'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="excused" name="Có phép" stackId="a" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="unexcused" name="Không phép" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center flex-col gap-2 text-gray-400 italic">
                                 <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                                 <span>Lớp học chuyên cần tốt, chưa có học sinh vắng.</span>
                            </div>
                        )}
                    </div>
                </div>
           </div>
       )}

       {/* --- NỘI DUNG CHÍNH (Table View - Both Web & Print - BUT HIDDEN FOR PARENT IF THEY HAVE SEPARATE VIEW) --- */}
       
       {!isParent && (
           <>
               {/* Section 1: Thống kê số liệu (Dạng bảng cho bản in) */}
               <div className="print-only mb-6">
                   <h3 className="font-bold text-lg mb-2 uppercase">I. Thống kê chung ({termLabel})</h3>
                   <table className="w-full text-left border-collapse border border-black text-sm">
                       {/* ... Existing table header ... */}
                       <thead>
                           <tr className="bg-gray-100">
                               <th className="border border-black p-2 text-center" rowSpan={2}>Sĩ số</th>
                               <th className="border border-black p-2 text-center" colSpan={2}>Giới tính</th>
                               <th className="border border-black p-2 text-center" colSpan={4}>Học lực</th>
                               <th className="border border-black p-2 text-center" colSpan={4}>Rèn luyện</th>
                           </tr>
                           <tr className="bg-gray-50">
                               <th className="border border-black p-1 text-center">Nam</th>
                               <th className="border border-black p-1 text-center">Nữ</th>
                               <th className="border border-black p-1 text-center">Tốt</th>
                               <th className="border border-black p-1 text-center">Khá</th>
                               <th className="border border-black p-1 text-center">Đạt</th>
                               <th className="border border-black p-1 text-center">CĐ</th>
                               <th className="border border-black p-1 text-center">Tốt</th>
                               <th className="border border-black p-1 text-center">Khá</th>
                               <th className="border border-black p-1 text-center">Đạt</th>
                               <th className="border border-black p-1 text-center">CĐ</th>
                           </tr>
                       </thead>
                       <tbody>
                           <tr>
                               <td className="border border-black p-2 text-center font-bold">{total}</td>
                               <td className="border border-black p-2 text-center">{male}</td>
                               <td className="border border-black p-2 text-center">{female}</td>
                               <td className="border border-black p-2 text-center">{stats.academic['Tốt']}</td>
                               <td className="border border-black p-2 text-center">{stats.academic['Khá']}</td>
                               <td className="border border-black p-2 text-center">{stats.academic['Đạt']}</td>
                               <td className="border border-black p-2 text-center">{stats.academic['Chưa đạt']}</td>
                               <td className="border border-black p-2 text-center">{stats.conduct['Tốt']}</td>
                               <td className="border border-black p-2 text-center">{stats.conduct['Khá']}</td>
                               <td className="border border-black p-2 text-center">{stats.conduct['Đạt']}</td>
                               <td className="border border-black p-2 text-center">{stats.conduct['Chưa đạt']}</td>
                           </tr>
                       </tbody>
                   </table>

                   {/* Add new table for Awards in Print View */}
                   {Object.keys(stats.awards).length > 0 && (
                       <div className="mt-4">
                            <h4 className="font-bold text-sm mb-2">Thống kê Danh hiệu:</h4>
                            <table className="w-full text-left border-collapse border border-black text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-black p-2 text-center">Danh hiệu</th>
                                        <th className="border border-black p-2 text-center w-24">Số lượng</th>
                                        <th className="border border-black p-2 text-center w-24">Tỷ lệ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(stats.awards).map(([awardName, count]) => (
                                        <tr key={awardName}>
                                            <td className="border border-black p-2">{awardName}</td>
                                            <td className="border border-black p-2 text-center font-bold">{count}</td>
                                            <td className="border border-black p-2 text-center">
                                                {total > 0 ? ((Number(count) / total) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                       </div>
                   )}
               </div>

               {/* Section 2: Chi tiết chuyên cần */}
               <div>
                   <div className="flex items-center gap-3 mb-4 no-print mt-8">
                        <h2 className="text-xl font-bold text-gray-900">Chi tiết chuyên cần</h2>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Tổng {totalSchoolDays} ngày điểm danh</span>
                   </div>
                   
                   <h3 className="font-bold text-lg mb-2 uppercase print-only">II. Chi tiết chuyên cần</h3>

                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:col-span-3 print:shadow-none print:border-none">
                        <div className="overflow-x-auto max-h-[400px] print:max-h-none">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 bg-gray-50 shadow-sm z-10 print:static print:shadow-none">
                                    <tr className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <th className="p-4 w-12 text-center print:border print:border-black print:bg-gray-200">STT</th>
                                        <th className="p-4 print:border print:border-black print:bg-gray-200">Học sinh</th>
                                        <th className="p-4 text-center print:border print:border-black print:bg-gray-200">Hiện diện</th>
                                        <th className="p-4 text-center print:border print:border-black print:bg-gray-200">Vắng CP</th>
                                        <th className="p-4 text-center print:border print:border-black print:bg-gray-200">Vắng KP</th>
                                        <th className="p-4 w-32 print:border print:border-black print:bg-gray-200">Tỷ lệ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 print:divide-y-0">
                                    {studentAttendanceStats.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-center text-gray-500 font-medium print:text-black print:border print:border-black">{index + 1}</td>
                                            <td className="p-4 print:border print:border-black">
                                                <div className="font-bold text-gray-800">{student.fullName}</div>
                                            </td>
                                            <td className="p-4 text-center font-medium text-green-600 bg-green-50/30 print:bg-transparent print:text-black print:border print:border-black">{student.present}</td>
                                            <td className="p-4 text-center font-medium text-orange-600 print:text-black print:border print:border-black">{student.excused}</td>
                                            <td className="p-4 text-center font-bold text-red-600 bg-red-50/30 print:bg-transparent print:text-black print:border print:border-black">{student.unexcused}</td>
                                            <td className="p-4 print:border print:border-black">
                                                <span className={`text-sm font-bold ${
                                                    student.attendanceRate >= 90 ? 'text-green-600' : 
                                                    student.attendanceRate >= 75 ? 'text-blue-600' : 'text-red-600'
                                                } print:text-black`}>
                                                    {student.attendanceRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
               </div>
           </>
       )}
       
       {/* --- FOOTER KÝ TÊN (Print Only) --- */}
       <div className="print-only mt-10">
            <div className="flex justify-between text-center">
                <div className="w-1/2">
                    <h4 className="font-bold uppercase text-sm">Hiệu Trưởng</h4>
                    <p className="italic text-xs text-gray-500">(Ký và đóng dấu)</p>
                    <div className="h-24"></div>
                    <p className="font-bold text-sm">........................................</p>
                </div>
                <div className="w-1/2">
                    <h4 className="font-bold uppercase text-sm">Giáo viên chủ nhiệm</h4>
                    <div className="h-24 flex items-center justify-center my-1">
                        {classInfo.teacherSignature ? (
                            <img src={classInfo.teacherSignature} className="h-full object-contain" alt="Sign" />
                        ) : (
                            <div className="h-full"></div>
                        )}
                    </div>
                    <p className="font-bold text-sm">{classInfo.teacherName}</p>
                </div>
            </div>
       </div>
    </div>
  );
};

export default Reports;
