
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Plus, Upload, Trash2, Edit, FileSpreadsheet, X, Check, Save, Download, Filter, User, AlertTriangle, Camera, Move, RotateCcw, ZoomIn, Sun } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Student, Gender } from '../types';
import ConfirmModal from '../components/ConfirmModal';

interface ImportStats {
  total: number;
  male: number;
  female: number;
  ethnicities: Record<string, number>;
}

// Danh sách 54 dân tộc Việt Nam
const ETHNICITIES = [
  "Kinh", "Tày", "Thái", "Mường", "Hoa (Hán)", "Khơ-me", "Nùng", "H'Mông", "Dao", "Gia-rai", 
  "Ê-đê", "Ba-na", "Sán Chay", "Chăm", "Xơ-đăng", "Sán Dìu", "Hrê", "Cơ-ho", "Ra-glai", "Mnông", 
  "Thổ", "Xtiêng", "Khơmú", "Bru-Vân Kiều", "Giáy", "Cơ-tu", "Gié-Triêng", "Ta-ôi", "Mạ", "Co", 
  "Chơ-ro", "Hà Nhì", "Xinh-mun", "Chu-ru", "Lào", "La-chí", "Phù Lá", "La Hủ", "Kháng", "Lự", 
  "Pà Thẻn", "Lô Lô", "Chứt", "Mảng", "Cờ Lao", "Bố Y", "La Ha", "Cống", "Ngái", "Si La", 
  "Pu Péo", "Brâu", "Rơ-măm", "Ơ-đu"
];

const StudentList: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, addStudents, clearAllStudents, showToast } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{ students: Student[], stats: ImportStats } | null>(null);
  
  // Single Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Batch Delete State
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: '', lastName: '', fullName: '', gender: Gender.MALE, dateOfBirth: '', address: '',
    status: 'studying', placeOfBirth: '', ethnicity: 'Kinh', cccd: '', avatar: '',
    fatherName: '', fatherPhone: '', fatherJob: '',
    motherName: '', motherPhone: '', motherJob: '',
  });

  // --- IMAGE EDITOR STATES ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgBrightness, setImgBrightness] = useState(100);
  const [imgBlur, setImgBlur] = useState(0);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const EDITOR_SIZE = 160; 

  const generateNewId = () => {
      return `HS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000)}`;
  };

  const parseDate = (input: any): string => {
      if (!input) return '';
      if (typeof input === 'number') {
           const date = new Date(Math.round((input - 25569) * 86400 * 1000));
           return date.toISOString().split('T')[0];
      }
      if (typeof input === 'string') {
          if (input.includes('/')) {
              const parts = input.split('/');
              if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
      }
      try {
          return new Date(input).toISOString().split('T')[0];
      } catch {
          return '';
      }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
              if (data.length > 0) data.shift(); // Remove header

              let tempStudents: Student[] = [];
              let currentStudentsList = [...students]; 
              let stats: ImportStats = { total: 0, male: 0, female: 0, ethnicities: {} };
              let skippedCount = 0; 

              data.forEach((row, index) => {
                  if (!row[1]) return; // Must have First Name
                  
                  const cccd = row[7]?.toString().trim() || '';
                  let newId = '';
                  
                  if (cccd) {
                      newId = `HS${cccd}`;
                  } else {
                      const timestamp = Date.now().toString().slice(-6);
                      const randomPart = Math.floor(Math.random() * 1000);
                      newId = `HS${timestamp}${index}${randomPart}`;
                  }
                  
                  const dob = parseDate(row[2]);
                  const lastName = row[0]?.toString().trim() || '';
                  const firstName = row[1]?.toString().trim() || '';
                  
                  const newStudent: Student = {
                      id: newId,
                      firstName: firstName,
                      lastName: lastName,
                      fullName: `${lastName} ${firstName}`.trim(),
                      dateOfBirth: dob || new Date().toISOString().split('T')[0],
                      placeOfBirth: row[3]?.toString().trim() || '',
                      gender: (row[4]?.toString().trim().toLowerCase().includes('nữ') ? Gender.FEMALE : Gender.MALE),
                      ethnicity: row[5]?.toString().trim() || 'Kinh',
                      status: 'studying',
                      cccd: cccd,
                      address: row[8]?.toString().trim() || '',
                      fatherName: row[9]?.toString().trim() || '',
                      fatherYearOfBirth: row[10]?.toString().trim() || '',
                      fatherPhone: row[11]?.toString().trim() || '',
                      fatherJob: row[12]?.toString().trim() || '',
                      motherName: row[13]?.toString().trim() || '',
                      motherYearOfBirth: row[14]?.toString().trim() || '',
                      motherPhone: row[15]?.toString().trim() || '',
                      motherJob: row[16]?.toString().trim() || '',
                      guardianName: row[17]?.toString().trim() || '',
                      guardianPhone: row[18]?.toString().trim() || '',
                      guardianJob: row[19]?.toString().trim() || '',
                      notes: row[20]?.toString().trim() || '',
                      // Backward compatibility
                      parentName: row[9]?.toString().trim() || row[13]?.toString().trim() || '',
                      parentPhone: row[11]?.toString().trim() || row[15]?.toString().trim() || '',
                  };
                  
                  const isDuplicate = currentStudentsList.some(s => s.id === newStudent.id);
                  
                  if (isDuplicate) {
                      skippedCount++;
                      return; 
                  }
                  
                  tempStudents.push(newStudent);
                  currentStudentsList.push(newStudent);
                  
                  stats.total++;
                  if (newStudent.gender === Gender.MALE) stats.male++; else stats.female++;
                  const eth = newStudent.ethnicity || 'Khác';
                  stats.ethnicities[eth] = (stats.ethnicities[eth] || 0) + 1;
              });

              if (skippedCount > 0) {
                  showToast('warning', `Đã bỏ qua ${skippedCount} học sinh do trùng ID hoặc CCCD.`);
              }

              if (tempStudents.length > 0) {
                  setImportPreview({ students: tempStudents, stats });
              } else if (skippedCount === 0) {
                  showToast('info', 'Không tìm thấy dữ liệu mới.');
              } else {
                  showToast('info', 'Tất cả dữ liệu trong file đã tồn tại trên hệ thống.');
              }
          } catch (error) {
              console.error(error);
              showToast('error', 'Lỗi file Excel. Vui lòng kiểm tra định dạng.');
          } finally {
              setIsImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = "";
          }
      };
      reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
      if (importPreview) {
          addStudents(importPreview.students);
          showToast('success', `Đã thêm thành công ${importPreview.students.length} học sinh.`);
          setImportPreview(null);
      }
  };

  const handleDownloadTemplate = () => {
      const headers = [
          "Họ đệm", "Tên", "Ngày sinh", "Nơi sinh", "Giới tính", "Dân tộc", "Trạng thái", "CCCD", "Địa chỉ",
          "Họ tên Cha", "Năm sinh Cha", "SĐT Cha", "Nghề nghiệp Cha",
          "Họ tên Mẹ", "Năm sinh Mẹ", "SĐT Mẹ", "Nghề nghiệp Mẹ",
          "Họ tên GH", "SĐT GH", "Nghề nghiệp GH", "Ghi chú"
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau_Nhap_Lieu");
      XLSX.writeFile(wb, "Mau_Danh_Sach_Hoc_Sinh.xlsx");
  };

  // --- IMAGE HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { 
              showToast('error', 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewImage(reader.result as string);
              setImgScale(1);
              setImgBrightness(100);
              setImgBlur(0);
              setImgPos({ x: 0, y: 0 });
          };
          reader.readAsDataURL(file);
      }
  };

  const resetImageFilters = (e: React.MouseEvent) => {
      e.stopPropagation();
      setImgScale(1);
      setImgBrightness(100);
      setImgBlur(0);
      setImgPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!previewImage) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - imgPos.x, y: e.clientY - imgPos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !previewImage) return;
      e.preventDefault();
      setImgPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const processImage = () => {
      if (!previewImage || !imageCanvasRef.current) return null;
      const canvas = imageCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = previewImage;

      return new Promise<string>((resolve) => {
          img.onload = () => {
              const OUTPUT_SIZE = 300; 
              canvas.width = OUTPUT_SIZE;
              canvas.height = OUTPUT_SIZE;

              if (ctx) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
                  ctx.filter = `brightness(${imgBrightness}%) blur(${imgBlur}px)`;
                  
                  ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
                  const ratio = OUTPUT_SIZE / EDITOR_SIZE;
                  ctx.translate(imgPos.x * ratio, imgPos.y * ratio);
                  ctx.scale(imgScale, imgScale);

                  const renderWidth = OUTPUT_SIZE;
                  const renderHeight = (img.height / img.width) * OUTPUT_SIZE;
                  
                  ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
                  resolve(canvas.toDataURL('image/jpeg', 0.85));
              }
          };
      });
  };

  // ... CRUD Handlers ...
  const openEditModal = (s?: Student) => {
    if (s) {
      setEditingStudent(s);
      
      let formattedDob = '';
      if (s.dateOfBirth) {
          const date = new Date(s.dateOfBirth);
          if (!isNaN(date.getTime())) {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              formattedDob = `${yyyy}-${mm}-${dd}`;
          } else {
              if (s.dateOfBirth.includes('/') && s.dateOfBirth.split('/').length === 3) {
                  const parts = s.dateOfBirth.split('/');
                  formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else {
                  formattedDob = s.dateOfBirth;
              }
          }
      }

      setFormData({
          ...s,
          dateOfBirth: formattedDob,
          status: s.status || 'studying',
          fatherJob: s.fatherJob || '',
          motherJob: s.motherJob || ''
      });
      setPreviewImage(s.avatar || null);
    } else {
      setEditingStudent(null);
      setFormData({
        firstName: '', lastName: '', fullName: '', gender: Gender.MALE, dateOfBirth: '', address: '',
        status: 'studying', placeOfBirth: '', ethnicity: 'Kinh', cccd: '', avatar: '',
        fatherName: '', fatherPhone: '', fatherJob: '',
        motherName: '', motherPhone: '', motherJob: '',
      });
      setPreviewImage(null);
    }
    setImgScale(1);
    setImgBrightness(100);
    setImgBlur(0);
    setImgPos({ x: 0, y: 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.lastName || ''} ${formData.firstName || ''}`.trim();
    
    let finalAvatar = formData.avatar;
    if (previewImage) {
        finalAvatar = await processImage() || finalAvatar;
    } else if (!previewImage && editingStudent?.avatar) {
        finalAvatar = undefined;
    }

    let finalId = editingStudent ? editingStudent.id : generateNewId();
    
    if (!editingStudent && formData.cccd) {
        const cccdId = `HS${formData.cccd.trim()}`;
        if (students.some(s => s.id === cccdId)) {
            showToast('error', `Học sinh với số CCCD ${formData.cccd} đã tồn tại (ID: ${cccdId})!`);
            return;
        }
        finalId = cccdId;
    }

    const studentData: Student = {
        ...formData as Student,
        status: formData.status || 'studying',
        fullName,
        id: finalId,
        avatar: finalAvatar
    };
    
    if (editingStudent) {
        updateStudent(studentData);
        showToast('success', 'Cập nhật thông tin học sinh thành công');
    } else {
        addStudent(studentData);
        showToast('success', 'Thêm học sinh mới thành công');
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (s: Student) => {
      setStudentToDelete(s);
      setDeleteModalOpen(true);
  };

  const handleDelete = () => {
      if (studentToDelete) {
          deleteStudent(studentToDelete.id);
          showToast('success', 'Đã xóa học sinh');
      }
      setDeleteModalOpen(false);
      setStudentToDelete(null);
  };
  
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    clearAllStudents();
    showToast('success', 'Đã xóa toàn bộ danh sách học sinh.');
    setIsDeleting(false);
    setShowDeleteAllConfirm(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.includes(searchTerm)
    );
  }, [students, searchTerm]);

  return (
    <div className="space-y-6">
       <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Xóa học sinh"
        message={`Bạn có chắc chắn muốn xóa học sinh ${studentToDelete?.fullName}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

       <ConfirmModal 
        isOpen={showDeleteAllConfirm}
        title="Xóa toàn bộ danh sách?"
        message={`Hành động này sẽ XÓA TẤT CẢ ${students.length} học sinh hiện có cùng toàn bộ dữ liệu điểm số, điểm danh liên quan. Bạn có chắc chắn muốn tiếp tục?`}
        confirmLabel={isDeleting ? "Đang xóa..." : "Xóa tất cả"}
        isDestructive={true}
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAllConfirm(false)}
      />

      {importPreview && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                  <div className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <FileSpreadsheet className="text-green-600" /> Xác nhận dữ liệu nhập
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                          <p className="font-bold text-gray-700 mb-2">Thống kê:</p>
                          <ul className="grid grid-cols-2 gap-2 text-sm">
                              <li>Tổng số: <b>{importPreview.stats.total}</b></li>
                              <li>Nam: <b>{importPreview.stats.male}</b></li>
                              <li>Nữ: <b>{importPreview.stats.female}</b></li>
                          </ul>
                      </div>
                      <div className="flex gap-3 justify-end">
                          <button onClick={() => setImportPreview(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                          <button onClick={handleConfirmImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Xác nhận nhập</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Main UI */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách Học sinh</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý hồ sơ và thông tin cá nhân.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
            {students.length > 0 && (
                <button 
                    onClick={() => setShowDeleteAllConfirm(true)}
                    disabled={isDeleting}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    {isDeleting ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />} 
                    Xóa DS
                </button>
            )}
            <button onClick={handleDownloadTemplate} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium">
                <Download size={16} /> Mẫu Excel
            </button>
            <div className="relative">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportExcel} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isImporting}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                 >
                    {isImporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Upload size={16} />} 
                    Nhập Excel
                 </button>
            </div>
            <button onClick={() => openEditModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                <Plus size={16} /> Thêm Mới
            </button>
        </div>
      </div>
      
      {/* Search & List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm học sinh..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                      <tr>
                          <th className="p-4 w-12 text-center">STT</th>
                          <th className="p-4">Họ và Tên</th>
                          <th className="p-4">Ngày sinh</th>
                          <th className="p-4">Giới tính</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-right">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredStudents.length > 0 ? filteredStudents.map((s, index) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                              <td className="p-4 text-center font-medium text-gray-500">{index + 1}</td>
                              <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                                  {s.avatar ? (
                                      <img src={s.avatar} alt={s.fullName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                  ) : (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold ${s.gender === Gender.FEMALE ? 'bg-pink-400' : 'bg-blue-400'}`}>
                                          {s.firstName.charAt(0)}
                                      </div>
                                  )}
                                  <div>
                                      <p>{s.fullName}</p>
                                      <p className="text-xs text-gray-400 font-normal">{s.id}</p>
                                  </div>
                              </td>
                              <td className="p-4 text-gray-600">
                                  {new Date(s.dateOfBirth).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="p-4 text-gray-600">{s.gender}</td>
                              <td className="p-4">
                                  {(!s.status || s.status === 'studying') && <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-200">Đang học</span>}
                                  {s.status === 'dropped_out' && <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-200">Nghỉ học</span>}
                                  {s.status === 'transfer' && <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-bold border border-orange-200">Chuyển trường</span>}
                              </td>
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                      <button onClick={() => confirmDelete(s)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                  </div>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Không tìm thấy học sinh.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* MODAL EDIT/CREATE */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                     <h3 className="text-xl font-bold">{editingStudent ? 'Cập nhật thông tin' : 'Thêm học sinh mới'}</h3>
                     <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                 </div>
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     {/* --- AVATAR UPLOAD SECTION --- */}
                     <div className="flex justify-center mb-6">
                        <div 
                            className={`relative group bg-gray-100 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            style={{ width: `${EDITOR_SIZE}px`, height: `${EDITOR_SIZE}px` }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        >
                            {previewImage ? (
                                <>
                                    <img 
                                        src={previewImage} 
                                        alt="Preview" 
                                        className="w-full h-auto object-cover pointer-events-none select-none transition-transform duration-75 ease-linear"
                                        style={{
                                            transform: `translate(${imgPos.x}px, ${imgPos.y}px) scale(${imgScale})`,
                                            filter: `brightness(${imgBrightness}%) blur(${imgBlur}px)`
                                        }}
                                    />
                                    <div className="absolute bottom-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none flex items-center gap-1">
                                        <Move size={10} /> Kéo để chỉnh
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-400 pointer-events-none">
                                    <Camera size={32} className="mx-auto mb-1 opacity-50" />
                                    <p className="text-xs">Tải ảnh</p>
                                </div>
                            )}
                            
                            <label className={`absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 text-white font-medium transition-opacity ${previewImage ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                <Upload size={20} />
                                <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleImageUpload} />
                            </label>

                            {previewImage && (
                                <button 
                                    type="button"
                                    onClick={resetImageFilters}
                                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white text-gray-600 shadow-sm z-20"
                                    title="Đặt lại"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                        </div>
                        <canvas ref={imageCanvasRef} className="hidden" />
                     </div>

                     {previewImage && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 mb-4">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1"><ZoomIn size={12}/> Zoom</span>
                                <input type="range" min="1" max="3" step="0.1" value={imgScale} onChange={e => setImgScale(parseFloat(e.target.value))} className="w-24 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Sun size={12}/> Sáng</span>
                                <input type="range" min="50" max="150" value={imgBrightness} onChange={e => setImgBrightness(parseFloat(e.target.value))} className="w-24 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                            </div>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ đệm</label>
                             <input className="w-full p-2 border rounded" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên</label>
                             <input className="w-full p-2 border rounded" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh</label>
                             <input type="date" className="w-full p-2 border rounded" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giới tính</label>
                             <select className="w-full p-2 border rounded" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                                 <option value={Gender.MALE}>Nam</option>
                                 <option value={Gender.FEMALE}>Nữ</option>
                             </select>
                         </div>
                     </div>

                     {/* ROW 3: Status, Ethnicity, CCCD */}
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                             <select 
                                className="w-full p-2 border rounded" 
                                value={formData.status || 'studying'} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                             >
                                 <option value="studying">Đang học</option>
                                 <option value="dropped_out">Nghỉ học</option>
                                 <option value="transfer">Chuyển trường</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dân tộc</label>
                             <select 
                                className="w-full p-2 border rounded" 
                                value={formData.ethnicity || 'Kinh'} 
                                onChange={e => setFormData({...formData, ethnicity: e.target.value})}
                             >
                                {ETHNICITIES.map(eth => (
                                    <option key={eth} value={eth}>{eth}</option>
                                ))}
                             </select>
                         </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CCCD / Mã ĐD</label>
                             <input 
                                className="w-full p-2 border rounded" 
                                value={formData.cccd || ''} 
                                onChange={e => setFormData({...formData, cccd: e.target.value})} 
                                placeholder="Nhập số CCCD..."
                             />
                             {!editingStudent && <p className="text-[10px] text-gray-400 mt-1">* ID sẽ là "HS" + số CCCD</p>}
                         </div>
                     </div>
                     
                     {/* CONTACT INFO WITH JOBS ADDED */}
                     <div className="border-t pt-4 mt-4">
                         <h4 className="font-bold text-gray-700 mb-2">Thông tin liên hệ</h4>
                         <div className="grid grid-cols-1 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ</label>
                                 <input className="w-full p-2 border rounded" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                             </div>
                             
                             {/* Father Info */}
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ tên Cha</label>
                                     <input className="w-full p-2 border rounded" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT Cha</label>
                                     <input className="w-full p-2 border rounded" value={formData.fatherPhone} onChange={e => setFormData({...formData, fatherPhone: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nghề nghiệp</label>
                                     <input className="w-full p-2 border rounded" value={formData.fatherJob} onChange={e => setFormData({...formData, fatherJob: e.target.value})} />
                                 </div>
                             </div>

                             {/* Mother Info */}
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ tên Mẹ</label>
                                     <input className="w-full p-2 border rounded" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT Mẹ</label>
                                     <input className="w-full p-2 border rounded" value={formData.motherPhone} onChange={e => setFormData({...formData, motherPhone: e.target.value})} />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nghề nghiệp</label>
                                     <input className="w-full p-2 border rounded" value={formData.motherJob} onChange={e => setFormData({...formData, motherJob: e.target.value})} />
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Hủy</button>
                         <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Lưu lại</button>
                     </div>
                 </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default StudentList;
