
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Student, Gender, Role } from '../types';
import * as XLSX from 'xlsx';
import { Download, Upload, Printer, FileText, CheckSquare, Square, Zap, Info, Edit, RefreshCw, Calculator, Filter, AlertCircle, X, Check, Save, Trash2, Sparkles, User, ListFilter, Image as ImageIcon } from 'lucide-react';
import { calculatePerformance, calculateYearlyScores, calculateYearlyConduct, calculateAward } from '../utils/grading';
import ConfirmModal from '../components/ConfirmModal';
import html2canvas from 'html2canvas';

const SCORE_SUBJECTS = [
  "Toán", "Ngữ văn", "Ngoại ngữ", "GDCD", "Công nghệ", "Tin học", "KHTN", "LS-ĐL"
];

const ASSESSMENT_SUBJECTS = [
  "GDTC", "Nghệ thuật", "HĐTN", "GDĐP"
];

const SUBJECTS = [...SCORE_SUBJECTS, ...ASSESSMENT_SUBJECTS];

// --- FALLBACK COMMENTS ---
const DEFAULT_COMMENTS = {
    'Tốt': 'Chăm ngoan, học giỏi, có ý thức xây dựng bài.',
    'Khá': 'Ngoan, có cố gắng trong học tập. Cần phát huy hơn nữa.',
    'Đạt': 'Sức học trung bình, cần chăm chỉ làm bài tập về nhà.',
    'Chưa đạt': 'Học lực yếu, cần cố gắng nhiều hơn và chú ý nghe giảng.'
};

// --- COMPONENT: PHIẾU LIÊN LẠC (Dùng cho in ấn) ---
const ScoreCard: React.FC<{ student: Student; term: 'HK1' | 'HK2' | 'CN'; id?: string }> = ({ student, term, id }) => {
  const { classInfo, attendanceHistory } = useApp();
  const termData = student.transcript?.[term] || { scores: {} };
  const scores = termData.scores || {};
  const rank = termData.academicRank || '-';
  const conduct = termData.conduct || '-';
  const award = termData.award || '-';

  const getAbsenceStats = (studentId: string) => {
      let p = 0; let k = 0;
      attendanceHistory.forEach(day => {
          const rec = day.records.find(r => r.studentId === studentId);
          if (rec?.status === 'excused') p++;
          if (rec?.status === 'unexcused') k++;
      });
      return { p, k };
  };

  const stats = getAbsenceStats(student.id);
  const termLabel = term === 'CN' ? 'Cả Năm' : term === 'HK1' ? 'Học Kỳ 1' : 'Học Kỳ 2';

  return (
      <div id={id} className="bg-white p-8 max-w-[210mm] mx-auto border border-gray-300 shadow-sm print:shadow-none print:border-none print:break-after-page mb-8 print:w-full print:mx-0">
          <div className="flex justify-between items-start mb-6 font-serif">
              <div className="text-center w-1/2">
                  <p className="uppercase text-xs font-bold">UBND HUYỆN {classInfo.location?.toUpperCase() || '...'}</p>
                  <p className="uppercase text-sm font-bold text-blue-900 print:text-black">{classInfo.schoolName || 'TRƯỜNG THCS ...'}</p>
                  <p className="text-xs">Năm học {classInfo.schoolYear}</p>
              </div>
              <div className="text-right w-1/2 pr-4">
                  <p className="text-xs italic">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
          </div>
          <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">PHIẾU LIÊN LẠC {termLabel.toUpperCase()}</h1>
              <p className="text-sm font-semibold">Họ và Tên: <span className="text-lg uppercase">{student.fullName}</span> | Lớp: {classInfo.className}</p>
          </div>
          <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                  <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                          <tr className="bg-gray-100 print:bg-gray-200">
                              <th className="border border-black p-1 w-10 text-center">STT</th>
                              <th className="border border-black p-1 text-left">Môn học</th>
                              <th className="border border-black p-1 w-16 text-center">Kết quả</th>
                          </tr>
                      </thead>
                      <tbody>
                          {SUBJECTS.map((sub, idx) => (
                                <tr key={sub}>
                                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                                    <td className="border border-black p-1 px-2">{sub}</td>
                                    <td className="border border-black p-1 text-center font-bold">{scores[sub] !== undefined ? scores[sub] : '-'}</td>
                                </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="w-1/2 flex flex-col gap-4">
                  <table className="w-full border-collapse border border-black text-sm">
                      <tbody>
                          <tr><td className="border border-black p-2 font-bold bg-gray-50 print:bg-transparent">Học lực (Xếp loại)</td><td className="border border-black p-2 text-center font-bold uppercase">{rank}</td></tr>
                          <tr><td className="border border-black p-2 font-bold bg-gray-50 print:bg-transparent">Kết quả rèn luyện</td><td className="border border-black p-2 text-center font-bold uppercase">{conduct}</td></tr>
                          <tr><td className="border border-black p-2 font-bold bg-gray-50 print:bg-transparent">Nghỉ (P/K)</td><td className="border border-black p-2 text-center">{stats.p}/{stats.k}</td></tr>
                          <tr><td className="border border-black p-2 font-bold bg-gray-50 print:bg-transparent">Danh hiệu</td><td className="border border-black p-2 text-center">{award}</td></tr>
                      </tbody>
                  </table>
                  <div className="border border-black p-3 h-full flex flex-col text-sm">
                      <p className="font-bold underline italic mb-2">Nhận xét của GVCN:</p>
                      <div className="flex-1 whitespace-pre-wrap font-serif">
                         {student.transcript?.[term]?.academicNotes || student.academicNotes || ''}
                      </div>
                  </div>
              </div>
          </div>
          <div className="mt-4 pt-2">
              <p className="font-bold italic underline mb-16 text-sm">Ý kiến của Phụ huynh:</p>
              <div className="flex justify-end text-center mt-4">
                  <div>
                      <p className="italic text-sm">{classInfo.location || '...'}, ngày {new Date().getDate()}, tháng {new Date().getMonth()+1}, năm {new Date().getFullYear()}</p>
                      <p className="font-bold text-sm uppercase mt-1">Giáo viên chủ nhiệm</p>
                      <div className="h-24 flex items-center justify-center">
                          {classInfo.teacherSignature ? (
                              <img src={classInfo.teacherSignature} alt="Signature" className="h-20 object-contain" />
                          ) : (
                              <div className="h-20"></div>
                          )}
                      </div>
                      <p className="font-bold text-sm">{classInfo.teacherName}</p>
                  </div>
              </div>
          </div>
      </div>
  );
};

interface ImportPreviewData {
    totalRows: number;
    updatedCount: number;
    updates: Student[];
}

interface AcademicResultsProps {
    defaultView?: 'table' | 'scorecard';
}

export default function AcademicResults({ defaultView }: AcademicResultsProps) {
  const { students, updateStudent, updateStudents, classInfo, showToast, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scoreCardRef = useRef<HTMLDivElement>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isParent = currentUser?.role === Role.PARENT;

  const [viewMode, setViewMode] = useState<'table' | 'scorecard'>(() => {
      if (isParent) return 'scorecard';
      return defaultView || 'table';
  });

  const [currentTerm, setCurrentTerm] = useState<'HK1' | 'HK2' | 'CN'>('HK1');
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
      if (!isParent && defaultView) {
          setViewMode(defaultView);
      } else if (isParent) {
          setViewMode('scorecard');
      }
  }, [defaultView, isParent]);

  const sortedStudents = useMemo(() => {
    let list = [...students].filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');
    if (isParent && currentUser?.studentId) {
        list = list.filter(s => s.id === currentUser.studentId);
    }
    return list.sort((a, b) => {
        const nameA = (a.firstName || '').toLowerCase();
        const nameB = (b.firstName || '').toLowerCase();
        if (nameA !== nameB) return nameA.localeCompare(nameB, 'vi');
        return (a.lastName || '').localeCompare(b.lastName || '', 'vi');
    });
  }, [students, isParent, currentUser]);

  useEffect(() => {
      if (viewMode === 'scorecard') {
          if (sortedStudents.length > 0 && selectedForPrint.length === 0 && isParent) {
              setSelectedForPrint([sortedStudents[0].id]);
          }
      }
  }, [viewMode, sortedStudents, isParent]);

  const toggleSelectOne = (id: string) => {
      if (selectedForPrint.includes(id)) setSelectedForPrint(prev => prev.filter(sid => sid !== id));
      else setSelectedForPrint(prev => [...prev, id]);
  };

  const handleSelectAll = () => {
      if (selectedForPrint.length === sortedStudents.length) {
          setSelectedForPrint([]);
      } else {
          setSelectedForPrint(sortedStudents.map(s => s.id));
      }
  };

  const handleSelectByRank = (rank: string) => {
      if (!rank) return;
      const matchingIds = sortedStudents.filter(s => {
          const r = s.transcript?.[currentTerm]?.academicRank;
          return r === rank;
      }).map(s => s.id);
      
      if (matchingIds.length === 0) {
          showToast('info', `Không có học sinh nào xếp loại ${rank} trong ${currentTerm}`);
          return;
      }

      setSelectedForPrint(matchingIds);
      showToast('success', `Đã chọn ${matchingIds.length} học sinh xếp loại ${rank}`);
  };

  const handleDownloadTemplate = () => {
    const headers = ["ID Học sinh", "Họ và tên đệm", "Tên", "Giới tính", "Ngày sinh", ...SUBJECTS];
    const data = sortedStudents.map(s => {
        const row: any = { 
            "ID Học sinh": s.id, 
            "Họ và tên đệm": s.lastName,
            "Tên": s.firstName,
            "Giới tính": s.gender,
            "Ngày sinh": new Date(s.dateOfBirth).toLocaleDateString('vi-VN')
        };
        const termData = s.transcript?.[currentTerm]?.scores || {};
        SUBJECTS.forEach(sub => { row[sub] = termData[sub] || ""; });
        return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    worksheet['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 },
        ...SUBJECTS.map(() => ({ wch: 8 }))
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Diem_${currentTerm}`);
    XLSX.writeFile(workbook, `Mau_Nhap_Diem_${classInfo.className}_${currentTerm}.xlsx`);
    showToast('success', `Đã tải xuống file mẫu ${currentTerm}!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            
            const tempUpdates: Student[] = [];
            let updatedCount = 0;

            data.forEach((row) => {
                const normalizedRow: any = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.trim()] = row[key];
                });

                const studentId = normalizedRow["ID Học sinh"]?.toString();
                const originalStudent = students.find(s => s.id === studentId);
                
                if (originalStudent) {
                    const student = JSON.parse(JSON.stringify(originalStudent));
                    const transcript = student.transcript || {};
                    const termData = transcript[currentTerm] || { scores: {} };
                    const scores = { ...termData.scores };
                    
                    let hasChanges = false;
                    SUBJECTS.forEach(sub => {
                        let val = normalizedRow[sub];
                        if (val !== undefined && val !== null && val !== "") {
                             if (SCORE_SUBJECTS.includes(sub)) {
                                const valStr = val.toString().trim().replace(',', '.');
                                const parsedVal = parseFloat(valStr);
                                val = !isNaN(parsedVal) ? parsedVal.toString() : val.toString(); 
                             } else {
                                 val = val.toString().trim();
                             }
                             const currentVal = scores[sub] !== undefined ? scores[sub].toString() : undefined;
                             if (currentVal !== val) {
                                 scores[sub] = val; 
                                 hasChanges = true;
                             }
                        }
                    });

                    if (!termData.conduct) {
                        termData.conduct = 'Tốt';
                        hasChanges = true;
                    }

                    if (hasChanges || !termData.academicRank) {
                        const { rank } = calculatePerformance(scores);
                        student.transcript = { 
                            ...transcript, 
                            [currentTerm]: { ...termData, scores, academicRank: rank, conduct: termData.conduct } 
                        };
                        tempUpdates.push(student);
                        updatedCount++;
                    }
                }
            });

            if (updatedCount > 0) {
                setImportPreview({
                    totalRows: data.length,
                    updatedCount: updatedCount,
                    updates: tempUpdates
                });
            } else {
                showToast('info', 'Không có dữ liệu mới để cập nhật.');
            }

        } catch (error) { 
            console.error(error);
            showToast('error', 'Lỗi file Excel. Vui lòng kiểm tra định dạng.'); 
        }
        finally { setIsProcessing(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
      if (importPreview && importPreview.updates.length > 0) {
          updateStudents(importPreview.updates); 
          setRefreshKey(prev => prev + 1);
          showToast('success', `Đã cập nhật dữ liệu cho ${importPreview.updatedCount} học sinh!`);
          setImportPreview(null);
      }
  };

  const handleScoreUpdate = (studentId: string, subject: string, value: string) => {
      if (isParent) return;
      const student = students.find(s => s.id === studentId);
      if (!student || currentTerm === 'CN') return;
      const transcript = student.transcript || {};
      const termData = transcript[currentTerm] || { scores: {} };
      const newScores = { ...termData.scores };
      const isAssessment = ASSESSMENT_SUBJECTS.includes(subject);

      if (value === '') delete newScores[subject];
      else {
           if (isAssessment) {
              let finalVal = value.trim().toUpperCase();
              if (['1', 'D', 'DAT', 'ĐẠT', 'P'].includes(finalVal)) finalVal = 'Đ';
              if (['2', 'C', 'K', 'CD', 'CHƯA ĐẠT', 'F'].includes(finalVal)) finalVal = 'CĐ';
              newScores[subject] = finalVal;
           } else {
              let valStr = value.replace(',', '.');
              let num = parseFloat(valStr);
              if (!isNaN(num)) {
                  if (num > 10) num = num / 10;
                  if (num > 10) num = 10;
                  if (num < 0) num = 0;
                  newScores[subject] = num.toString();
              }
           }
      }
      const { rank } = calculatePerformance(newScores);
      updateStudent({ ...student, transcript: { ...transcript, [currentTerm]: { ...termData, scores: newScores, academicRank: rank } } });
  };

  const handleConductUpdate = (studentId: string, val: string) => {
      if (isParent) return;
      const student = students.find(s => s.id === studentId);
      if (student) {
          const transcript = student.transcript || {};
          const termData = transcript[currentTerm] || { scores: {} };
          updateStudent({ ...student, transcript: { ...transcript, [currentTerm]: { ...termData, conduct: val } } });
      }
  };

  const handleBatchUpdate = () => {
      setIsProcessing(true);
      const updates: Student[] = [];

      if (currentTerm === 'CN') {
          let updatedCount = 0;
          students.forEach(s => {
              const student = JSON.parse(JSON.stringify(s));
              const transcript = student.transcript || {};
              const hk1 = transcript['HK1'];
              const hk2 = transcript['HK2'];

              if (hk1 && hk2) {
                  const cnScores = calculateYearlyScores(hk1.scores || {}, hk2.scores || {});
                  const { rank } = calculatePerformance(cnScores);
                  let conduct = transcript.CN?.conduct;
                  if (!conduct) {
                      conduct = calculateYearlyConduct(hk1.conduct, hk2.conduct);
                  }
                  const award = calculateAward(rank || '', conduct || '', cnScores);
                  student.transcript = { 
                      ...transcript, 
                      CN: { scores: cnScores, academicRank: rank, conduct: conduct, award: award } 
                  };
                  updates.push(student);
                  updatedCount++;
              }
          });
          if (updatedCount > 0) {
              updateStudents(updates);
              showToast('success', `Đã tổng kết Cả năm cho ${updatedCount} học sinh có đủ dữ liệu 2 kỳ!`);
          } else {
              showToast('warning', 'Chưa có đủ dữ liệu HK1 và HK2 để tổng kết.');
          }
      } else {
          students.forEach(s => {
              const student = JSON.parse(JSON.stringify(s));
              const transcript = student.transcript || {};
              const { rank } = calculatePerformance(transcript[currentTerm]?.scores);
              student.transcript = { 
                  ...transcript, 
                  [currentTerm]: { ...transcript[currentTerm], academicRank: rank } 
              };
              updates.push(student);
          });
          updateStudents(updates);
          showToast('success', `Đã cập nhật xếp loại ${currentTerm}!`);
      }
      setTimeout(() => setIsProcessing(false), 500);
  };

  const handleAutoComment = () => {
      setIsProcessing(true);
      const updates: Student[] = [];
      let updatedCount = 0;
      students.forEach(s => {
          const student = JSON.parse(JSON.stringify(s)); 
          if (!student.transcript) student.transcript = {};
          if (!student.transcript[currentTerm]) student.transcript[currentTerm] = { scores: {} };
          const termData = student.transcript[currentTerm];
          const rank = termData.academicRank ? termData.academicRank.trim() : null;
          if (rank) {
              const configs = classInfo.scoreComments || [];
              let config = configs.find(c => c.rank && c.rank.toLowerCase() === rank.toLowerCase() && c.term === currentTerm);
              if (!config) config = configs.find(c => c.rank && c.rank.toLowerCase() === rank.toLowerCase() && !c.term);
              let commentContent = config ? config.content : DEFAULT_COMMENTS[rank as keyof typeof DEFAULT_COMMENTS] || '';
              if (commentContent && termData.academicNotes !== commentContent) {
                  termData.academicNotes = commentContent;
                  updates.push(student);
                  updatedCount++;
              }
          }
      });
      if (updates.length > 0) {
          updateStudents(updates);
          showToast('success', `Đã cập nhật nhận xét cho ${updatedCount} học sinh (${currentTerm})!`);
      } else {
          showToast('info', 'Không có thay đổi nào.');
      }
      setTimeout(() => setIsProcessing(false), 500);
  };

  const handleBatchDelete = () => {
      setIsProcessing(true);
      const updates: Student[] = [];
      students.forEach(s => {
          const student = JSON.parse(JSON.stringify(s));
          if (student.transcript && student.transcript[currentTerm]) {
              const currentData = student.transcript[currentTerm];
              student.transcript[currentTerm] = { ...currentData, scores: {}, academicRank: undefined, academicNotes: undefined };
              updates.push(student);
          }
      });
      if (updates.length > 0) {
          updateStudents(updates);
          setRefreshKey(prev => prev + 1); 
          showToast('success', `Đã xóa toàn bộ điểm ${currentTerm}!`);
      } else {
          showToast('info', 'Không có dữ liệu điểm để xóa.');
      }
      setIsProcessing(false);
      setShowDeleteConfirm(false);
  };

  const handlePrint = () => {
    if (viewMode === 'scorecard' && selectedForPrint.length === 0) { showToast('error', 'Chọn học sinh để in.'); return; }
    window.print();
  };

  const handleExportImage = async () => {
      // Logic for Teachers: Must select exactly one student to export as image safely
      if (selectedForPrint.length !== 1) {
          showToast('error', 'Vui lòng chọn chính xác 1 học sinh để xuất ảnh.');
          return;
      }
      
      const studentId = selectedForPrint[0];
      const cardElement = document.getElementById(`scorecard-${studentId}`);
      
      if (!cardElement) {
          showToast('error', 'Không tìm thấy phiếu liên lạc.');
          return;
      }

      setIsProcessing(true);
      try {
          const canvas = await html2canvas(cardElement, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff'
          });
          const image = canvas.toDataURL("image/png");
          const link = document.createElement('a');
          const studentName = sortedStudents.find(s => s.id === studentId)?.fullName || 'HocSinh';
          link.href = image;
          link.download = `PhieuLienLac_${studentName}_${currentTerm}.png`;
          link.click();
          showToast('success', 'Đã xuất hình ảnh thành công!');
      } catch (error) {
          console.error("Export failed", error);
          showToast('error', 'Lỗi khi xuất hình ảnh.');
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title={`Xóa điểm ${currentTerm}?`}
        message={`Bạn có chắc chắn muốn xóa TOÀN BỘ DỮ LIỆU ĐIỂM của học kỳ ${currentTerm}? Hành động này sẽ xóa dữ liệu trên hệ thống và không thể hoàn tác.`}
        confirmLabel="Xóa Ngay"
        isDestructive={true}
        onConfirm={handleBatchDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {importPreview && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                              <Upload size={24} className="text-blue-600"/>
                              Xác nhận nhập dữ liệu
                          </h3>
                          <button onClick={() => setImportPreview(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                              <X size={24} />
                          </button>
                      </div>
                      <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                  <p className="font-bold">Tổng quan dữ liệu:</p>
                                  <ul className="list-disc ml-4 mt-1 space-y-1">
                                      <li>Tổng số dòng trong file: <b>{importPreview.totalRows}</b></li>
                                      <li>Số học sinh được cập nhật: <b>{importPreview.updatedCount}</b></li>
                                      <li>Học kỳ áp dụng: <b>{currentTerm}</b></li>
                                  </ul>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-3 mt-8">
                          <button onClick={() => setImportPreview(null)} className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors">Hủy bỏ</button>
                          <button onClick={confirmImport} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-colors"><Save size={18} /> Cập nhật ngay</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="no-print space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6 w-full md:w-auto">
                <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
                    {viewMode === 'table' ? 'Sổ Điểm Điện Tử' : 'Phiếu Liên Lạc'}
                </h1>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button onClick={() => setCurrentTerm('HK1')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 'HK1' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Học Kỳ 1</button>
                    <button onClick={() => setCurrentTerm('HK2')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 'HK2' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Học Kỳ 2</button>
                    <button onClick={() => setCurrentTerm('CN')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTerm === 'CN' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>Cả Năm</button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                {!isParent && (
                    <div className="bg-gray-100 p-1 rounded-lg flex mr-2">
                        <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><Edit size={16} /></button>
                        <button onClick={() => setViewMode('scorecard')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'scorecard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><FileText size={16} /></button>
                    </div>
                )}
                
                {viewMode === 'table' && !isParent && (
                    <>
                        <button onClick={handleBatchUpdate} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-sm text-sm hover:bg-indigo-700 transition-colors">{isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Calculator size={18} />}{currentTerm === 'CN' ? 'Tính Cả Năm' : 'Xếp loại'}</button>
                        <button onClick={handleAutoComment} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold shadow-sm text-sm hover:bg-purple-700 transition-colors">{isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />} Nhận xét</button>
                        <button onClick={() => setShowDeleteConfirm(true)} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors"><Trash2 size={18} /> Xóa Điểm</button>
                        <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium text-sm hover:bg-green-100 transition-colors"><Download size={18} /> Mẫu</button>
                        {currentTerm !== 'CN' && (
                            <div className="relative"><input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"><Upload size={18} /> Import</button></div>
                        )}
                    </>
                )}
                
                {viewMode === 'scorecard' && (
                    <>
                        <button onClick={handleExportImage} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"><ImageIcon size={18} /> Xuất Ảnh</button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-gray-900 transition-colors shadow-sm"><Printer size={18} /> In Phiếu</button>
                    </>
                )}
                {viewMode === 'table' && (
                     <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors"><Printer size={18} /> In</button>
                )}
            </div>
          </div>
      </div>

      {viewMode === 'table' && !isParent && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[11px]">
                            <th className="p-2 border-r w-10 text-center sticky left-0 bg-gray-50 z-20">STT</th>
                            <th className="p-2 border-r sticky left-10 bg-gray-50 w-44 z-20 text-left">Họ và tên đệm</th>
                            <th className="p-2 border-r sticky left-[13.5rem] bg-gray-50 w-20 z-20 text-left shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tên</th>
                            <th className="p-2 border-r text-center bg-gray-50 w-16">Giới tính</th>
                            <th className="p-2 border-r text-center bg-gray-50 w-24">Ngày sinh</th>
                            {SUBJECTS.map(sub => (
                                <th key={sub} className="p-2 border-r text-center w-14">{sub}</th>
                            ))}
                            <th className="p-2 border-r text-center bg-blue-50 w-20">Học lực</th>
                            <th className="p-2 text-center bg-purple-50 w-24">Hạnh kiểm</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedStudents.map((student, index) => {
                            const termData = student.transcript?.[currentTerm] || { scores: {} };
                            const scores = termData.scores || {};
                            return (
                                <tr key={student.id} className="hover:bg-gray-50 group">
                                    <td className="p-2 border-r text-center sticky left-0 bg-white z-10">{index + 1}</td>
                                    <td className="p-2 border-r sticky left-10 bg-white z-10 truncate text-gray-700" title={student.lastName}>{student.lastName}</td>
                                    <td className="p-2 border-r font-bold sticky left-[13.5rem] bg-white z-10 truncate text-blue-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex items-center gap-1">
                                        {student.avatar && <img src={student.avatar} alt="" className="w-4 h-4 rounded-full object-cover border border-gray-100" />}
                                        {student.firstName}
                                    </td>
                                    <td className="p-2 border-r text-center text-xs text-gray-600">{student.gender}</td>
                                    <td className="p-2 border-r text-center text-xs text-gray-600">{new Date(student.dateOfBirth).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                                    {SUBJECTS.map(sub => (
                                        <td key={`${student.id}-${sub}-${currentTerm}-${refreshKey}`} className="p-0 border-r text-center">
                                            <input type="text" readOnly={currentTerm === 'CN'}
                                                className={`w-full p-2 text-center outline-none bg-transparent font-medium text-xs h-full focus:bg-blue-100 transition-colors ${currentTerm === 'CN' ? 'text-gray-500' : ''}`}
                                                defaultValue={scores[sub] || ''}
                                                onFocus={(e) => e.target.select()}
                                                onBlur={(e) => handleScoreUpdate(student.id, sub, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-2 border-r text-center font-bold text-blue-700 bg-blue-50/30 text-xs">{termData.academicRank || '-'}</td>
                                    <td className="p-0 text-center bg-purple-50/30">
                                         <select className="w-full h-full bg-transparent text-center outline-none cursor-pointer p-1 text-xs font-semibold"
                                            value={termData.conduct || ''} onChange={(e) => handleConductUpdate(student.id, e.target.value)}>
                                            <option value="">--</option>
                                            <option value="Tốt">Tốt</option>
                                            <option value="Khá">Khá</option>
                                            <option value="Đạt">Đạt</option>
                                            <option value="Chưa đạt">C.Đạt</option>
                                         </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {viewMode === 'scorecard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
              {!isParent && (
                  <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
                      <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10 space-y-3">
                          <div className="font-bold text-sm text-gray-800">Chọn học sinh in phiếu</div>
                          <div className="space-y-2">
                              <div onClick={handleSelectAll} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-dashed border-gray-300">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedForPrint.length === sortedStudents.length && sortedStudents.length > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 text-transparent bg-white'}`}>
                                      <Check size={14} strokeWidth={3} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">Chọn tất cả ({sortedStudents.length})</span>
                              </div>
                              <div className="relative group">
                                  <ListFilter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-600" />
                                  <select onChange={(e) => { handleSelectByRank(e.target.value); e.target.value = ""; }} className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-gray-50 hover:bg-white font-medium text-gray-700 cursor-pointer transition-all" defaultValue="">
                                      <option value="" disabled>-- Lọc theo xếp loại ({currentTerm}) --</option>
                                      <option value="Tốt">Học lực: Tốt</option>
                                      <option value="Khá">Học lực: Khá</option>
                                      <option value="Đạt">Học lực: Đạt</option>
                                      <option value="Chưa đạt">Học lực: Chưa đạt</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                      <div className="overflow-y-auto flex-1 p-2 space-y-1">
                          {sortedStudents.map(s => (
                              <div key={s.id} onClick={() => toggleSelectOne(s.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedForPrint.includes(s.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                                {selectedForPrint.includes(s.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                <span className="text-sm font-medium">{s.fullName}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              <div className={`${isParent ? 'col-span-4' : 'md:col-span-3'} overflow-y-auto h-[calc(100vh-200px)] bg-gray-100 p-4 border rounded-xl`} ref={scoreCardRef}>
                  {sortedStudents.filter(s => isParent || selectedForPrint.includes(s.id)).map(student => (
                      <ScoreCard key={student.id} student={student} term={currentTerm} id={`scorecard-${student.id}`} />
                  ))}
                  {sortedStudents.length === 0 && <div className="text-center text-gray-500 mt-10">Không có dữ liệu.</div>}
                  {(!isParent && selectedForPrint.length === 0 && sortedStudents.length > 0) && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <Printer size={48} className="mb-2 opacity-50"/>
                          <p>Vui lòng chọn học sinh để xem phiếu điểm.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
