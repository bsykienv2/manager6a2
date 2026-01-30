
import React, { useState, useEffect, useRef } from 'react';
import { Save, School, UserCircle, Calendar, Monitor, AlertTriangle, RefreshCcw, MapPin, Trophy, Plus, X, Database, Link as LinkIcon, MessageSquare, Layout, CheckSquare, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ClassInfo, Role, UserAccount, ScoreCommentConfig } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const Settings: React.FC = () => {
  const { classInfo, updateClassInfo, showToast, apiUrl, updateApiUrl } = useApp();
  const [info, setInfo] = useState<ClassInfo>({ className: '', teacherName: '', schoolYear: '', schoolName: '', location: '', awardTitles: [], scoreComments: [], teacherSignature: '' });
  const [localApiUrl, setLocalApiUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'comments' | 'data'>('general');

  // New Award/Comment State
  const [newAward, setNewAward] = useState('');
  
  // Comment Config State
  const [commentType, setCommentType] = useState<'rank' | 'score'>('rank');
  const [commentTerm, setCommentTerm] = useState<'HK1' | 'HK2' | 'CN'>('HK1');
  const [newScoreComment, setNewScoreComment] = useState<Partial<ScoreCommentConfig>>({ min: 0, max: 10, rank: 'Tốt', content: '' });

  // Signature Handling
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ dữ liệu khi tải trang
  useEffect(() => {
    if (classInfo) {
        setInfo(classInfo);
    }
    setLocalApiUrl(apiUrl || '');
  }, [classInfo, apiUrl]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
        updateClassInfo(info);
        updateApiUrl(localApiUrl.trim());
        showToast('success', 'Đã lưu cài đặt thành công!');
        setIsSaving(false);
    }, 600);
  };

  const handleResetData = () => {
      const defaultAccounts: UserAccount[] = [
          { id: 'admin_default', username: 'admin', password: '123', fullName: 'GV Chủ Nhiệm (Admin)', role: Role.HOMEROOM },
          { id: 'teacher_default', username: 'gv_bomon', password: '123', fullName: 'GV Bộ Môn (Mẫu)', role: Role.SUBJECT, department: 'Khoa học Tự nhiên' },
          { id: 'parent_default', username: 'phuhuynh', password: '123', fullName: 'Phụ huynh (Mẫu)', role: Role.PARENT, studentId: '' }
      ];

      localStorage.setItem('lhs_students', '[]'); 
      localStorage.setItem('lhs_attendance', '[]'); 
      localStorage.setItem('lhs_reviews', '[]'); 
      localStorage.setItem('lhs_notifications', '[]'); 
      localStorage.removeItem('lhs_dashboard_note'); 
      localStorage.setItem('lhs_system_initialized_v2', 'true');
      localStorage.setItem('lhs_users_list_v2', JSON.stringify(defaultAccounts));
      
      const defaultClassInfo: ClassInfo = {
          className: 'LỚP MỚI',
          teacherName: defaultAccounts[0].fullName,
          schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          schoolName: info.schoolName || '',
          location: info.location || '',
          awardTitles: ['Học sinh Xuất sắc', 'Học sinh Giỏi'],
          scoreComments: [],
          teacherSignature: ''
      };
      localStorage.setItem('lhs_class_info', JSON.stringify(defaultClassInfo));
      localStorage.removeItem('lhs_current_user');

      showToast('success', 'Đã làm mới hệ thống.');
      setTimeout(() => {
          window.location.href = window.location.origin + window.location.pathname; 
      }, 1000);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) { 
              showToast('error', 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              // Resize image before setting state
              const img = new Image();
              img.src = reader.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const maxWidth = 300;
                  const scaleFactor = maxWidth / img.width;
                  
                  canvas.width = maxWidth;
                  canvas.height = img.height * scaleFactor;
                  
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const resizedBase64 = canvas.toDataURL('image/png', 0.8);
                      setInfo({ ...info, teacherSignature: resizedBase64 });
                  }
              };
          };
          reader.readAsDataURL(file);
      }
  };

  const removeSignature = () => {
      setInfo({ ...info, teacherSignature: '' });
      if (signatureInputRef.current) signatureInputRef.current.value = "";
  };

  // ... (addAward, removeAward, etc. remain the same) ...
  const addAward = () => {
      if (newAward.trim()) {
          const currentAwards = info.awardTitles || [];
          if (!currentAwards.includes(newAward.trim())) {
             setInfo({ ...info, awardTitles: [...currentAwards, newAward.trim()] });
             setNewAward('');
          } else {
              showToast('error', 'Danh hiệu này đã tồn tại!');
          }
      }
  };

  const removeAward = (title: string) => {
      const currentAwards = info.awardTitles || [];
      setInfo({ ...info, awardTitles: currentAwards.filter(t => t !== title) });
  };

  const addScoreComment = () => {
      if (!newScoreComment.content) {
          showToast('error', 'Vui lòng nhập nội dung nhận xét');
          return;
      }

      let newConfig: ScoreCommentConfig;

      if (commentType === 'rank') {
           newConfig = {
              id: Date.now().toString(),
              rank: newScoreComment.rank || 'Tốt',
              content: newScoreComment.content,
              term: commentTerm 
          };
      } else {
          if (newScoreComment.min === undefined || newScoreComment.max === undefined) {
             showToast('error', 'Vui lòng nhập khoảng điểm');
             return;
          }
           newConfig = {
              id: Date.now().toString(),
              min: Number(newScoreComment.min),
              max: Number(newScoreComment.max),
              content: newScoreComment.content,
              term: commentTerm 
          };
      }
      
      setInfo({ ...info, scoreComments: [...(info.scoreComments || []), newConfig] });
      setNewScoreComment(prev => ({ ...prev, content: '' }));
  };

  const removeScoreComment = (id: string) => {
      setInfo({ ...info, scoreComments: (info.scoreComments || []).filter(c => c.id !== id) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ConfirmModal 
        isOpen={resetModalOpen}
        title="Làm mới hệ thống (New School Year)"
        message="Hành động này sẽ XÓA TOÀN BỘ dữ liệu học sinh, điểm số, điểm danh và các tài khoản cũ. Hệ thống sẽ được đưa về trạng thái trắng. Bạn có chắc chắn muốn thực hiện?"
        confirmLabel="Xác nhận xóa & Reset"
        isDestructive={true}
        onConfirm={handleResetData}
        onCancel={() => setResetModalOpen(false)}
      />

      <div className="flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
              <p className="text-gray-500 mt-1 text-sm">Cấu hình thông tin lớp học và các tham số.</p>
          </div>
          <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:bg-blue-300 font-bold"
            >
                {isSaving ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={18} />}
                Lưu Cài Đặt
            </button>
      </div>
      
      {/* TABS HEADER */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'general' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  <School size={18} /> Thông tin Chung
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'comments' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  <MessageSquare size={18} /> Nhận xét & Danh hiệu
              </button>
              <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'data' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                  <Database size={18} /> Dữ liệu & Kết nối
              </button>
          </div>

          <div className="p-6 bg-gray-50/50 min-h-[400px]">
                {/* --- TAB 1: GENERAL INFO --- */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Thông tin Trường Lớp</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Trường</label>
                                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold text-gray-700 text-sm"
                                            placeholder="VD: TRƯỜNG THCS TÂN LẬP"
                                            value={info.schoolName || ''}
                                            onChange={e => setInfo({...info, schoolName: e.target.value.toUpperCase()})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                                            <MapPin size={14} /> Địa phương (Xã/Huyện)
                                        </label>
                                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="VD: Đồng Phú"
                                            value={info.location || ''}
                                            onChange={e => setInfo({...info, location: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Lớp</label>
                                            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 text-sm"
                                                placeholder="VD: 9A1"
                                                value={info.className}
                                                onChange={e => setInfo({...info, className: e.target.value.toUpperCase()})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                                                <Calendar size={14} /> Năm Học
                                            </label>
                                            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="VD: 2024 - 2025"
                                                value={info.schoolYear}
                                                onChange={e => setInfo({...info, schoolYear: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-gray-100 pt-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                            <UserCircle size={14} /> Giáo viên Chủ nhiệm
                                        </label>
                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 mb-1">Họ và tên</label>
                                                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                                    placeholder="Nhập họ và tên..."
                                                    value={info.teacherName}
                                                    onChange={e => setInfo({...info, teacherName: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 mb-1">Chữ ký điện tử</label>
                                                {info.teacherSignature ? (
                                                    <div className="relative group w-full h-[80px] bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2">
                                                        <img src={info.teacherSignature} alt="Signature" className="max-h-full max-w-full object-contain" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={removeSignature}
                                                                className="bg-white/20 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors"
                                                                title="Xóa chữ ký"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="w-full h-[80px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer relative"
                                                        onClick={() => signatureInputRef.current?.click()}
                                                    >
                                                        <ImageIcon size={24} className="mb-1 opacity-50" />
                                                        <span className="text-[10px] font-bold">Tải lên chữ ký (PNG/JPG)</span>
                                                        <input 
                                                            type="file" 
                                                            ref={signatureInputRef}
                                                            className="hidden" 
                                                            accept="image/png, image/jpeg, image/jpg"
                                                            onChange={handleSignatureUpload}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 rounded-xl shadow-lg sticky top-6 border border-gray-700">
                                <div className="flex items-center gap-2 mb-4 text-blue-300 border-b border-gray-700 pb-2">
                                    <Monitor size={18} />
                                    <h3 className="font-bold text-xs uppercase tracking-widest">Xem trước hiển thị</h3>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-tighter">Trên Phiếu liên lạc:</p>
                                        <div className="bg-white text-gray-800 p-3 rounded-lg text-center font-serif border border-gray-200 shadow-inner scale-95">
                                            <p className="uppercase text-[9px] font-bold text-gray-400">UBND HUYỆN {info.location?.toUpperCase() || '...'}</p>
                                            <p className="uppercase text-xs font-bold text-blue-700 tracking-tight">{info.schoolName || 'TÊN TRƯỜNG'}</p>
                                            <div className="h-4"></div>
                                            <p className="font-bold text-xs">PHIẾU LIÊN LẠC</p>
                                            <p className="text-[10px] italic">Lớp {info.className} - Năm {info.schoolYear}</p>
                                            
                                            <div className="mt-4 flex justify-end">
                                                <div className="text-center w-24">
                                                    <p className="text-[8px] font-bold uppercase">GV Chủ Nhiệm</p>
                                                    <div className="h-8 flex items-center justify-center my-1">
                                                        {info.teacherSignature ? (
                                                            <img src={info.teacherSignature} className="h-full object-contain" alt="Sign" />
                                                        ) : (
                                                            <span className="text-[8px] text-gray-300 italic">Chữ ký</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[8px] font-bold whitespace-nowrap">{info.teacherName || 'Tên Giáo Viên'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: COMMENTS & AWARDS --- */}
                {activeTab === 'comments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AWARDS */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-bold text-purple-700 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                                <Trophy size={16} /> Danh hiệu thi đua
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        placeholder="Thêm danh hiệu mới..."
                                        value={newAward}
                                        onChange={(e) => setNewAward(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addAward()}
                                    />
                                    <button onClick={addAward} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(info.awardTitles || []).map((title, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 text-xs font-bold text-purple-700">
                                            <span>{title}</span>
                                            <button onClick={() => removeAward(title)} className="text-purple-300 hover:text-red-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SCORE COMMENTS */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-sm font-bold text-blue-700 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                                <MessageSquare size={16} /> Cấu hình Nhận xét tự động
                            </h2>
                            
                            {/* Term Tabs for Comments */}
                            <div className="flex border-b border-gray-100 mb-4">
                                <button onClick={() => setCommentTerm('HK1')} className={`px-4 py-2 text-xs font-bold transition-all ${commentTerm === 'HK1' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Học kỳ 1</button>
                                <button onClick={() => setCommentTerm('HK2')} className={`px-4 py-2 text-xs font-bold transition-all ${commentTerm === 'HK2' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Học kỳ 2</button>
                                <button onClick={() => setCommentTerm('CN')} className={`px-4 py-2 text-xs font-bold transition-all ${commentTerm === 'CN' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Cả Năm</button>
                            </div>

                            {/* Type Selector */}
                            <div className="flex items-center gap-2 mb-4 bg-gray-50 p-1 rounded-lg w-fit">
                                <button 
                                    onClick={() => setCommentType('rank')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${commentType === 'rank' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    Theo Xếp loại
                                </button>
                                <button 
                                    onClick={() => setCommentType('score')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${commentType === 'score' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    Theo Điểm
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-4 gap-2">
                                    {commentType === 'score' ? (
                                        <>
                                            <div className="col-span-1">
                                                <input type="number" step="0.1" placeholder="Min" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                                    value={newScoreComment.min} onChange={e => setNewScoreComment({...newScoreComment, min: Number(e.target.value)})} />
                                            </div>
                                            <div className="col-span-1">
                                                <input type="number" step="0.1" placeholder="Max" className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                                    value={newScoreComment.max} onChange={e => setNewScoreComment({...newScoreComment, max: Number(e.target.value)})} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-2">
                                            <select 
                                                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none"
                                                value={newScoreComment.rank || 'Tốt'} 
                                                onChange={e => setNewScoreComment({...newScoreComment, rank: e.target.value})}
                                            >
                                                <option value="Tốt">Tốt</option>
                                                <option value="Khá">Khá</option>
                                                <option value="Đạt">Đạt</option>
                                                <option value="Chưa đạt">Chưa đạt</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <input type="text" placeholder="Nội dung nhận xét..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            value={newScoreComment.content} onChange={e => setNewScoreComment({...newScoreComment, content: e.target.value})} />
                                    </div>
                                </div>
                                <button onClick={addScoreComment} className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2">
                                    <Plus size={14} /> Thêm vào {commentTerm}
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {(info.scoreComments || [])
                                    .filter(c => c.term === commentTerm || (!c.term && commentTerm === 'HK1')) // Backward compat: empty term = HK1
                                    .map((config) => (
                                    <div key={config.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                        <div className="flex flex-col">
                                            {config.rank ? (
                                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded w-fit mb-1">
                                                    Xếp loại: {config.rank}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded w-fit mb-1">
                                                    Điểm: {config.min} - {config.max}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-700 leading-tight">{config.content}</span>
                                        </div>
                                        <button onClick={() => removeScoreComment(config.id)} className="text-gray-400 hover:text-red-500 p-1">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(info.scoreComments || []).filter(c => c.term === commentTerm || (!c.term && commentTerm === 'HK1')).length === 0 && (
                                    <p className="text-center text-xs text-gray-400 italic py-4">Chưa có cấu hình cho {commentTerm}.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: DATA & CONNECTION --- */}
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm ring-4 ring-blue-50/50">
                            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2 uppercase tracking-wider">
                                <Database size={16} className="text-blue-600" />
                                Cấu hình Máy chủ (Backend)
                            </h2>
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Nhập URL của <b>Google Apps Script Web App</b> (phiên bản /exec) để đồng bộ dữ liệu.
                                </p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                                        <LinkIcon size={14} /> URL Web App
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono text-blue-700 bg-gray-50 focus:bg-white"
                                        placeholder="https://script.google.com/macros/s/.../exec"
                                        value={localApiUrl}
                                        onChange={e => setLocalApiUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                            <h2 className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <AlertTriangle size={16} />
                                Vùng Nguy Hiểm
                            </h2>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-red-800">
                                    <p className="font-bold uppercase text-[10px] tracking-wider">Khởi tạo năm học mới</p>
                                    <p className="text-[11px] mt-1 opacity-80 leading-relaxed max-w-sm">
                                        Xóa toàn bộ dữ liệu học sinh, điểm số và các tài khoản cũ. 
                                        Chỉ giữ lại 3 tài khoản mẫu mặc định.
                                    </p>
                                </div>
                                <button onClick={() => setResetModalOpen(true)} className="bg-white border border-red-200 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                                    <RefreshCcw size={14} />
                                    Reset Dữ liệu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
          </div>
      </div>
    </div>
  );
};

export default Settings;
