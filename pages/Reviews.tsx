
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, CheckCircle2, Circle, Clock, Tag, Save, History, Trash2, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ReviewType, Review, Role } from '../types';

const REVIEW_TAGS = [
  "Ngoan, lễ phép", "Cần tập trung hơn", "Có tiến bộ rõ rệt", 
  "Hay nói chuyện riêng", "Hoàn thành tốt bài tập", "Chữ viết cẩn thận",
  "Đi học đầy đủ", "Cần cố gắng môn Toán", "Tích cực phát biểu"
];

const Reviews: React.FC = () => {
  const { students, reviews, addReview, deleteReview, showToast, currentUser } = useApp();

  // Filter States
  const [reviewType, setReviewType] = useState<ReviewType>('WEEKLY');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection & Form States
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  // Role Check
  const isParent = currentUser?.role === Role.PARENT;

  // Derived Values
  const periodName = useMemo(() => {
    const prefix = reviewType === 'WEEKLY' ? 'Tuần' : reviewType === 'MONTHLY' ? 'Tháng' : 'Học kỳ';
    return `${prefix} ${periodNumber}`;
  }, [reviewType, periodNumber]);

  // Determine status of each student for CURRENT period
  const studentsWithStatus = useMemo(() => {
      return students
        .filter(s => s.status !== 'dropped_out' && s.status !== 'transfer')
        .map(s => {
          const hasReview = reviews.some(r => 
              r.studentId === s.id && 
              r.type === reviewType && 
              r.periodName === periodName
          );
          return { ...s, isReviewed: hasReview };
      });
  }, [students, reviews, reviewType, periodName]);

  const filteredStudents = useMemo(() => {
      let list = studentsWithStatus.filter(s => 
          (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (isParent && currentUser?.studentId) {
          list = list.filter(s => s.id === currentUser.studentId);
      }
      return list;
  }, [studentsWithStatus, searchTerm, isParent, currentUser]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Auto select for Parent
  useEffect(() => {
      if (isParent && filteredStudents.length > 0 && !selectedStudentId) {
          setSelectedStudentId(filteredStudents[0].id);
      }
  }, [isParent, filteredStudents, selectedStudentId]);

  // Load existing review when student changes
  useEffect(() => {
    if (selectedStudentId) {
        const existingReview = reviews.find(r => 
            r.studentId === selectedStudentId && 
            r.type === reviewType && 
            r.periodName === periodName
        );
        setContent(existingReview ? existingReview.content : '');
    }
  }, [selectedStudentId, reviewType, periodName, reviews]);

  const handleSave = () => {
      if (!selectedStudentId || isParent) return;
      if (!content.trim()) {
          showToast('error', 'Nội dung nhận xét không được để trống');
          return;
      }

      const review: Review = {
          id: `${selectedStudentId}_${reviewType}_${periodName}`, // Composite ID for simplicity
          studentId: selectedStudentId,
          type: reviewType,
          periodName: periodName,
          content: content,
          date: new Date().toISOString()
      };

      addReview(review);
      showToast('success', `Đã lưu nhận xét ${periodName} cho ${selectedStudent?.fullName}`);
  };

  const addTag = (tag: string) => {
      if (content.includes(tag)) return;
      setContent(prev => prev ? `${prev}. ${tag}` : tag);
  };

  // Get history of THIS student (all periods)
  const studentHistory = useMemo(() => {
      if (!selectedStudentId) return [];
      return reviews
        .filter(r => r.studentId === selectedStudentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, selectedStudentId]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Top Toolbar: Filter Context */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                 <button 
                    onClick={() => setReviewType('WEEKLY')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${reviewType === 'WEEKLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     Theo Tuần
                 </button>
                 <button 
                    onClick={() => setReviewType('MONTHLY')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${reviewType === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                     Theo Tháng
                 </button>
             </div>
             
             <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Chọn {reviewType === 'WEEKLY' ? 'Tuần' : 'Tháng'}:</span>
                 <select 
                    value={periodNumber} 
                    onChange={(e) => setPeriodNumber(Number(e.target.value))}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none font-bold min-w-[60px]"
                 >
                    {Array.from({length: reviewType === 'WEEKLY' ? 35 : 9}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                 </select>
             </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-100">
              <Clock size={18} />
              <span className="font-bold text-sm">{isParent ? `Đang xem: ${periodName}` : `Đang nhận xét: ${periodName}`}</span>
          </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Left: Student List (Hidden for Parent if only 1 child) */}
          {!isParent && (
              <div className="w-full md:w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="p-4 border-b border-gray-100">
                      <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Tìm học sinh..." 
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedStudentId(s.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all group ${
                                selectedStudentId === s.id 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                      selectedStudentId === s.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                      {s.fullName.charAt(0)}
                                  </div>
                                  <span className={`text-sm font-medium ${selectedStudentId === s.id ? 'text-blue-800' : 'text-gray-700'}`}>
                                      {s.fullName}
                                  </span>
                              </div>
                              {s.isReviewed ? (
                                  <CheckCircle2 size={18} className="text-green-500" />
                              ) : (
                                  <Circle size={18} className="text-gray-200 group-hover:text-gray-300" />
                              )}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* Right: Review Form & History */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {selectedStudent ? (
                  <>
                    {/* Input Area (Hidden for Parent) */}
                    {!isParent && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        {selectedStudent.fullName}
                                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ID: {selectedStudent.id}</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Nhập nhận xét cho <b>{periodName}</b></p>
                                </div>
                                <button 
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                                >
                                    <Save size={18} /> Lưu nhận xét
                                </button>
                            </div>

                            {/* Quick Tags */}
                            <div className="mb-3 flex flex-wrap gap-2">
                                {REVIEW_TAGS.map((tag, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => addTag(tag)}
                                        className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-2 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                    >
                                        <Tag size={10} /> {tag}
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-700 min-h-[120px]"
                                placeholder={`Viết nhận xét về học tập, nề nếp của em ${selectedStudent.fullName}...`}
                            ></textarea>
                        </div>
                    )}

                    {/* History Area */}
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-gray-700 font-bold text-sm uppercase">
                            <History size={16} /> Lịch sử nhận xét
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {studentHistory.length > 0 ? (
                                studentHistory.map(historyItem => (
                                    <div key={historyItem.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                                historyItem.type === 'WEEKLY' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                                            }`}>
                                                {historyItem.periodName}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">
                                                    {new Date(historyItem.date).toLocaleDateString('vi-VN')}
                                                </span>
                                                {!isParent && (
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm('Xóa nhận xét này?')) deleteReview(historyItem.id);
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2 font-medium">{historyItem.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">Chưa có lịch sử nhận xét nào.</div>
                            )}
                        </div>
                    </div>
                  </>
              ) : (
                <div className="h-full bg-white rounded-xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400">
                    <Filter size={48} className="mb-4 text-gray-300" />
                    <p>Chọn một học sinh để xem nhận xét.</p>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Reviews;
