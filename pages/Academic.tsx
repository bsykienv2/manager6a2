
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Student, Role, TermData } from '../types';
import { Search, Save, BookOpen, Star, User, ChevronRight, CheckCircle2, Trophy, ChevronDown, Sparkles, Award, Calculator } from 'lucide-react';
import { calculateAward, calculateYearlyScores, calculateYearlyConduct, calculatePerformance } from '../utils/grading';

const SCORE_SUBJECTS = [
  "Toán", "Ngữ văn", "Ngoại ngữ", "GDCD", "Công nghệ", "Tin học", "KHTN", "LS-ĐL"
];

const ASSESSMENT_SUBJECTS = [
  "GDTC", "Nghệ thuật", "HĐTN", "GDĐP"
];

const Academic: React.FC = () => {
  const { students, updateStudent, updateStudents, classInfo, showToast, currentUser } = useApp();
  // Tạo local state để edit, khi save mới đẩy lên context
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Filter States
  const [selectedTerm, setSelectedTerm] = useState<'HK1' | 'HK2' | 'CN'>('HK1');

  // Role Check
  const isParent = currentUser?.role === Role.PARENT;

  // Sync local state when context students change (e.g. initial load)
  useEffect(() => {
    let list = students.filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');
    
    // Parent Filtering
    if (isParent && currentUser?.studentId) {
        list = list.filter(s => s.id === currentUser.studentId);
        // Auto select the child
        if (list.length > 0 && !selectedStudentId) {
            setSelectedStudentId(list[0].id);
        }
    }
    setLocalStudents(list);
  }, [students, isParent, currentUser]);

  // FIX: Update logic to write deep into transcript based on selectedTerm
  const handleUpdate = (field: string, value: any) => {
    if (!selectedStudentId || isParent) return; // Prevent parent edit
    
    setLocalStudents(prev => prev.map(s => {
        if (s.id !== selectedStudentId) return s;

        const newStudent = JSON.parse(JSON.stringify(s));
        if (!newStudent.transcript) newStudent.transcript = {};
        if (!newStudent.transcript[selectedTerm]) newStudent.transcript[selectedTerm] = { scores: {} };
        
        // Cập nhật trường đang chỉnh sửa
        newStudent.transcript[selectedTerm][field] = value;

        return newStudent;
    }));
  };

  // Button Action: Tự động tính danh hiệu (Cá nhân)
  const handleAutoAward = () => {
      if (!selectedStudentId || isParent) return;
      
      setLocalStudents(prev => prev.map(s => {
          if (s.id !== selectedStudentId) return s;
          const newStudent = JSON.parse(JSON.stringify(s));
          const termData = newStudent.transcript?.[selectedTerm] || { scores: {} };
          
          // Lấy dữ liệu để tính toán
          const academicRank = termData.academicRank || '';
          const conductRank = termData.conduct || '';
          const scores = termData.scores || {};

          // Tính danh hiệu
          const award = calculateAward(academicRank, conductRank, scores);
          
          // Cập nhật vào object
          if (!newStudent.transcript[selectedTerm]) newStudent.transcript[selectedTerm] = { scores: {} };
          newStudent.transcript[selectedTerm].award = award;
          
          showToast('success', `Đã xếp loại: ${award}`);
          return newStudent;
      }));
  };

  // Button Action: Xếp loại Cả lớp (Bulk)
  const handleClassClassification = () => {
      // Validate: Chỉ hoạt động khi chọn Cả Năm
      if (selectedTerm !== 'CN') {
          showToast('error', 'Danh hiệu thi đua chỉ tính cho cả năm học, xin vui lòng chọn lại!');
          return;
      }

      const updates: Student[] = [];
      let successCount = 0;
      let failCount = 0;

      // Duyệt qua danh sách local (đã lọc active)
      const newLocalStudents = localStudents.map(student => {
          const s = JSON.parse(JSON.stringify(student)) as Student;
          const hk1 = s.transcript?.HK1;
          const hk2 = s.transcript?.HK2;

          // Điều kiện: Phải có điểm và hạnh kiểm của cả 2 kỳ
          const hasHK1 = hk1 && hk1.scores && Object.keys(hk1.scores).length > 0 && hk1.conduct;
          const hasHK2 = hk2 && hk2.scores && Object.keys(hk2.scores).length > 0 && hk2.conduct;

          if (hasHK1 && hasHK2) {
              // 1. Tính điểm trung bình CN
              const cnScores = calculateYearlyScores(hk1.scores, hk2.scores);
              
              // 2. Tính Xếp loại Học lực CN
              const { rank } = calculatePerformance(cnScores);
              
              // 3. Tính Xếp loại Hạnh kiểm CN
              const cnConduct = calculateYearlyConduct(hk1.conduct, hk2.conduct);
              
              // 4. Suy ra Danh hiệu
              const award = calculateAward(rank || '', cnConduct || '', cnScores);

              // Cập nhật vào transcript CN
              if (!s.transcript) s.transcript = {};
              if (!s.transcript.CN) s.transcript.CN = { scores: {} };
              
              s.transcript.CN = {
                  ...s.transcript.CN,
                  scores: cnScores,
                  academicRank: rank,
                  conduct: cnConduct,
                  award: award
              };

              updates.push(s);
              successCount++;
              return s;
          } else {
              failCount++;
              return student; // Giữ nguyên nếu không đủ đk
          }
      });

      // Thông báo xác nhận
      const confirmMessage = `Kết quả kiểm tra dữ liệu:\n\n- Đủ điều kiện xếp loại: ${successCount} học sinh\n- Chưa đủ dữ liệu (HK1/HK2): ${failCount} học sinh\n\nBạn có muốn thực hiện xếp loại Cả năm cho ${successCount} học sinh này không?`;
      
      if (window.confirm(confirmMessage)) {
          setLocalStudents(newLocalStudents); // Cập nhật giao diện ngay
          if (updates.length > 0) {
              updateStudents(updates); // Lưu vào DB
              showToast('success', `Đã xếp loại thành công cho ${updates.length} học sinh!`);
          }
      }
  };

  const handleSave = () => {
    if (isParent) return;
    setIsSaving(true);
    // Tìm học sinh đang được chọn và update vào context
    const studentToSave = localStudents.find(s => s.id === selectedStudentId);
    if (studentToSave) {
        updateStudent(studentToSave);
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Đã lưu thành công!');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 600);
  };

  const filteredStudents = localStudents.filter(s => 
    (s.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = localStudents.find(s => s.id === selectedStudentId);

  // FIX: Get data from the specific term in transcript
  const termData = useMemo((): TermData => {
      if (!selectedStudent) return { scores: {} };
      return selectedStudent.transcript?.[selectedTerm] || { scores: {} }; 
  }, [selectedStudent, selectedTerm]);

  // Calculate statistics for the selected student and term
  const stats = useMemo(() => {
    if (!selectedStudent) return null;
    const scores = termData.scores || selectedStudent.subjectScores || {};
    
    let pass = 0; // Đ
    let fail = 0; // CĐ
    let s9 = 0, s8 = 0, s65 = 0, s5 = 0, sBelow5 = 0;
    
    ASSESSMENT_SUBJECTS.forEach(sub => {
        const val = scores[sub];
        if (val) {
            const s = val.toString().toUpperCase();
            if (['Đ', 'D', '1', 'DAT'].includes(s)) pass++;
            if (['CĐ', 'CD', '2', 'C', 'K', 'CHƯA ĐẠT'].includes(s)) fail++;
        }
    });

    SCORE_SUBJECTS.forEach(sub => {
        const val = parseFloat(scores[sub]);
        if (!isNaN(val)) {
            if (val >= 9.0) s9++;
            else if (val >= 8.0 && val < 9.0) s8++;
            else if (val >= 6.5 && val < 8.0) s65++;
            else if (val >= 5.0 && val < 6.5) s5++;
            else if (val < 5.0) sBelow5++;
        }
    });

    return { pass, fail, s9, s8, s65, s5, sBelow5 };
  }, [selectedStudent, termData]);

  const autoFillComment = () => { /* ... existing ... */ };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Left Sidebar: Student List (Hidden or simplified for Parent) */}
      {!isParent && (
          <div className="w-full md:w-1/4 lg:w-1/5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Danh sách lớp</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Tìm tên..." 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <button
                            key={student.id}
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                                selectedStudentId === student.id 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {student.avatar ? (
                                    <img src={student.avatar} alt="AVT" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                                ) : (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                                        selectedStudentId === student.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {student.fullName.charAt(0)}
                                    </div>
                                )}
                                <div className="truncate">
                                    <div className={`font-medium text-sm truncate ${selectedStudentId === student.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {student.fullName}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy.</div>
                )}
            </div>
          </div>
      )}

      {/* Right Content: Detail Form */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
        {selectedStudent ? (
            <>
                {/* 1. Header Information */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {selectedStudent.avatar ? (
                            <img 
                                src={selectedStudent.avatar} 
                                alt="Avatar" 
                                className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm flex-shrink-0" 
                            />
                        ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                                <User size={24} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedStudent.fullName}</h2>
                            <p className="text-sm text-gray-500">Học sinh lớp <span className="font-semibold text-black">{classInfo.className}</span> • {selectedStudent.gender}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                         {/* Filter Compact */}
                         <div className="flex items-center gap-2 mr-2">
                             <select 
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value as any)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-medium cursor-pointer"
                             >
                                <option value="HK1">Học kỳ 1</option>
                                <option value="HK2">Học kỳ 2</option>
                                <option value="CN">Cả năm</option>
                            </select>
                         </div>

                        {!isParent && (
                            <>
                                {/* Nút Xếp loại Cả lớp (Luôn hiện, xử lý logic khi bấm) */}
                                <button 
                                    onClick={handleClassClassification}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                                    title="Tự động tính điểm, xếp loại và danh hiệu cho toàn bộ lớp dựa trên HK1 và HK2 (Chỉ hoạt động ở tab Cả năm)"
                                >
                                    <Calculator size={18} />
                                    Xếp loại Cả lớp
                                </button>

                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 w-full sm:w-auto justify-center"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                                    Lưu thay đổi
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Main Content Columns - HORIZONTAL LAYOUT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-4">
                        
                        {/* COLUMN 1: KẾT QUẢ HỌC TẬP (BLUE) */}
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-blue-700 font-bold text-base uppercase tracking-tight">
                                <BookOpen size={18} />
                                <h3>Kết quả Học tập ({selectedTerm})</h3>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                                <label className="text-sm font-bold text-gray-700 mb-3 block">Xếp loại Học lực</label>
                                <div className="w-full py-4 bg-white border-2 border-blue-100 rounded-xl text-center mb-4">
                                    <span className="text-4xl font-extrabold text-blue-600 uppercase tracking-wider">
                                        {termData.academicRank || '--'}
                                    </span>
                                </div>
                                
                                {stats && (
                                <div className="flex-1 text-gray-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col">
                                    <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-3">
                                        <span className="font-bold text-blue-800 text-sm">Thống kê ({selectedTerm})</span>
                                    </div>
                                    
                                    {/* Môn xếp loại */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-semibold text-xs uppercase text-gray-500">Môn xếp loại:</span>
                                        <div className="font-bold text-sm">
                                            <span className="text-green-600">{stats.pass} Đ</span> <span className="text-gray-300">|</span> <span className="text-red-600">{stats.fail} CĐ</span>
                                        </div>
                                    </div>

                                    {/* Môn tính điểm */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="font-bold text-sm text-gray-800 mb-3 border-b border-dashed border-gray-300 pb-1">Môn tính điểm</div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">≥ 9.0:</span>
                                                <span className="text-xl font-bold text-gray-900">{stats.s9}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">8.0 - 9.0:</span>
                                                <span className="text-xl font-bold text-gray-900">{stats.s8}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">6.5 - 8.0:</span>
                                                <span className="text-xl font-bold text-gray-900">{stats.s65}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">5.0 - 6.5:</span>
                                                <span className="text-xl font-bold text-gray-900">{stats.s5}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t border-dashed border-red-200 pt-2 mt-1">
                                                <span className="text-sm font-bold text-red-600">Dưới 5.0:</span>
                                                <span className="text-xl font-bold text-red-600">{stats.sBelow5}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* COLUMN 2 & 3 Combined for other inputs */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            
                            {/* TOP ROW: Hạnh kiểm & Danh hiệu */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Hạnh kiểm - BIG & RED BOX */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-orange-700 font-bold text-base uppercase tracking-tight">
                                        <Star size={18} />
                                        <h3>Kết quả rèn luyện</h3>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                                        <label className="text-sm font-bold text-gray-700 mb-3 block">Xếp loại rèn luyện</label>
                                        <div className="relative w-full">
                                            <select 
                                                value={termData.conduct || 'Tốt'}
                                                onChange={e => handleUpdate('conduct', e.target.value)}
                                                disabled={isParent}
                                                className={`w-full py-4 text-center text-4xl font-extrabold text-red-600 appearance-none bg-white border-2 border-orange-100 rounded-xl outline-none transition-colors ${isParent ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-orange-300'}`}
                                            >
                                                <option value="Tốt">Tốt</option>
                                                <option value="Khá">Khá</option>
                                                <option value="Đạt">Đạt</option>
                                                <option value="Chưa đạt">Chưa đạt</option>
                                            </select>
                                            {!isParent && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                                                    <ChevronDown size={24} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Danh hiệu */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-purple-700 font-bold text-base uppercase tracking-tight">
                                        <Trophy size={18} />
                                        <h3>Danh hiệu</h3>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-gray-700 block">Danh hiệu thi đua</label>
                                            {/* Nút Xếp loại tự động cho CN (Cá nhân) */}
                                            {selectedTerm === 'CN' && !isParent && (
                                                <button 
                                                    onClick={handleAutoAward}
                                                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors font-bold flex items-center gap-1"
                                                    title="Tự động xếp loại danh hiệu cá nhân"
                                                >
                                                    <Award size={12} /> Xếp loại
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative flex-1">
                                            <select 
                                                value={termData.award || ''}
                                                onChange={e => handleUpdate('award', e.target.value)}
                                                disabled={isParent}
                                                className={`w-full h-full p-4 border border-purple-200 rounded-xl text-center text-xl font-bold text-purple-700 bg-purple-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none appearance-none dashed-border ${isParent ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                style={{ backgroundImage: 'none' }}
                                            >
                                                <option value="">-- Không có --</option>
                                                <option value="Không có">Không có</option>
                                                {(classInfo.awardTitles || []).map((title, idx) => (
                                                    <option key={idx} value={title}>{title}</option>
                                                ))}
                                            </select>
                                            {!isParent && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                                                    <ChevronDown size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM ROW: SINGLE GENERAL COMMENT */}
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-800 font-bold text-base uppercase tracking-tight">
                                        <CheckCircle2 size={18} className="text-gray-600"/>
                                        <h3>Nhận xét của giáo viên</h3>
                                    </div>
                                </div>
                                <div className="bg-white p-1 rounded-xl border border-gray-300 shadow-sm flex-1 flex flex-col">
                                    <textarea 
                                        className={`w-full p-4 rounded-lg bg-white text-gray-800 text-sm focus:outline-none resize-none flex-1 min-h-[180px] leading-relaxed ${isParent ? 'cursor-not-allowed bg-gray-50' : ''}`}
                                        placeholder={isParent ? "Chưa có nhận xét." : "Nhập nhận xét chung..."}
                                        value={termData.academicNotes || ''}
                                        onChange={e => handleUpdate('academicNotes', e.target.value)}
                                        readOnly={isParent}
                                    ></textarea>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <User size={40} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-600">Chưa chọn học sinh</h3>
                <p className="max-w-xs text-center mt-2">Vui lòng chọn một học sinh từ danh sách để xem.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Academic;
