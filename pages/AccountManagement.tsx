
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, X, Shield, Users, User, Search, Briefcase, Key, CheckCircle, AlertCircle, Clock, Check, Lock, Upload, Camera, Move, RotateCcw, ZoomIn, Sun, Droplet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserAccount, Role, Student } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const AccountManagement: React.FC = () => {
  const { userAccounts, students, addUserAccount, updateUserAccount, deleteUserAccount, currentUser, showToast } = useApp();
  
  // UI States
  const [activeTab, setActiveTab] = useState<'admin' | 'subject' | 'parent' | 'approval'>('subject');
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  
  // Grant Modal (Cấp tài khoản PH)
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [parentToGrant, setParentToGrant] = useState<{ student: Student; name: string; phone: string } | null>(null);
  const [grantFormData, setGrantFormData] = useState({ fullName: '', username: '', password: '' });

  const [formData, setFormData] = useState<Partial<UserAccount>>({
      username: '',
      password: '',
      fullName: '',
      role: Role.SUBJECT,
      department: '',
      avatar: ''
  });

  // --- IMAGE EDITOR STATES ---
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgBrightness, setImgBrightness] = useState(100);
  const [imgBlur, setImgBlur] = useState(0);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 }); // Pan position
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const EDITOR_SIZE = 200; // Smaller size for Account Modal

  // --- DATA PROCESSING ---

  // 1. Filter Teachers/Admin/Pending
  const filteredAccounts = useMemo(() => {
      return userAccounts.filter(u => {
          // Fix: Ensure properties are strings before calling toLowerCase to prevent runtime errors
          const fullNameSafe = String(u.fullName || '').toLowerCase();
          const usernameSafe = String(u.username || '').toLowerCase();
          const searchSafe = (search || '').toLowerCase();
          const matchesSearch = fullNameSafe.includes(searchSafe) || usernameSafe.includes(searchSafe);
          
          if (activeTab === 'approval') {
              return u.status === 'pending'; 
          }

          // Trong tab GV bộ môn, hiển thị cả người đang hoạt động và chờ duyệt
          if (activeTab === 'subject') {
              return u.role === Role.SUBJECT && matchesSearch;
          }

          // Tab Admin chỉ hiện admin đã active (để an toàn) hoặc tất cả admin
          if (activeTab === 'admin') {
              return u.role === Role.HOMEROOM && matchesSearch;
          }
          
          return false;
      });
  }, [userAccounts, activeTab, search]);

  // 2. Process Parent Accounts
  const parentRows = useMemo(() => {
      if (activeTab !== 'parent') return [];

      const rows = students.map(student => {
          if (!student) return null;
          // Priority: Father -> Mother -> Guardian
          const parentName = student.fatherName || student.motherName || student.guardianName || 'Phụ huynh';
          
          // Fix: Ensure phone is string before replace (handles numbers from Excel/JSON)
          const rawPhone = student.fatherPhone || student.motherPhone || student.guardianPhone || '';
          const phone = String(rawPhone).replace(/\s/g, ''); 
          
          // Tìm tài khoản đã tồn tại (bao gồm cả pending)
          // Note: username in userAccounts might be number if not normalized, but here we strictly look for match
          // We assume userAccounts are normalized on load or entry, but for safety in find:
          const existingAccount = userAccounts.find(u => String(u.username) === phone && u.role === Role.PARENT);
          
          const fullNameSafe = (student.fullName || '').toLowerCase();
          const parentNameSafe = (parentName || '').toLowerCase();
          const searchSafe = (search || '').toLowerCase();
          const matchesSearch = fullNameSafe.includes(searchSafe) || 
                                parentNameSafe.includes(searchSafe) ||
                                phone.includes(searchSafe);

          if (!matchesSearch) return null;

          return {
              student,
              parentName,
              phone,
              existingAccount,
              isValidPhone: phone && phone.length >= 9
          };
      }).filter((row): row is NonNullable<typeof row> => row !== null);

      return rows.sort((a, b) => {
          const nameA = (a.student?.firstName || '').toLowerCase();
          const nameB = (b.student?.firstName || '').toLowerCase();
          return nameA.localeCompare(nameB, 'vi');
      });
  }, [students, userAccounts, activeTab, search]);


  // --- HANDLERS ---

  const openModal = (user?: UserAccount) => {
      if (user) {
          setEditingUser(user);
          setFormData({ ...user }); 
          setPreviewImage(user.avatar || null);
      } else {
          setEditingUser(null);
          setFormData({
              username: '',
              password: '',
              fullName: '',
              role: activeTab === 'subject' ? Role.SUBJECT : Role.HOMEROOM,
              department: '',
              avatar: ''
          });
          setPreviewImage(null);
      }
      // Reset Image Filters
      setImgScale(1);
      setImgBrightness(100);
      setImgBlur(0);
      setImgPos({ x: 0, y: 0 });
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingUser(null);
  };

  // --- IMAGE HANDLING LOGIC (Copied & Adapted) ---
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

  const validateForm = () => {
      if (!formData.username || String(formData.username).length < 3) {
          showToast('error', 'Tên đăng nhập phải có ít nhất 3 ký tự');
          return false;
      }
      if (!formData.fullName) {
          showToast('error', 'Họ tên không được để trống');
          return false;
      }
      if (!formData.password || formData.password.length < 3) {
          showToast('error', 'Mật khẩu phải có ít nhất 3 ký tự');
          return false;
      }
      if (!editingUser) {
          // Ensure comparison matches types
          const exists = userAccounts.some(u => String(u.username) === String(formData.username));
          if (exists) {
              showToast('error', 'Tên đăng nhập đã tồn tại');
              return false;
          }
      }
      return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      // Process Avatar
      let finalAvatar = formData.avatar;
      if (previewImage) {
          finalAvatar = await processImage() || finalAvatar;
      }

      const updatedData = { ...formData, avatar: finalAvatar };

      if (editingUser) {
          updateUserAccount(updatedData as UserAccount);
          showToast('success', 'Cập nhật tài khoản thành công');
      } else {
          const newUser: UserAccount = {
              ...updatedData as UserAccount,
              id: Date.now().toString(),
              status: 'active'
          };
          addUserAccount(newUser);
          showToast('success', 'Thêm tài khoản mới thành công');
      }
      closeModal();
  };

  const confirmDelete = (user: UserAccount) => {
      if (user.id === currentUser?.username || user.username === 'admin') {
          showToast('error', 'Không thể xóa tài khoản Admin chính');
          return;
      }
      setUserToDelete(user);
      setDeleteModalOpen(true);
  };

  const handleDelete = () => {
      if (userToDelete) {
          deleteUserAccount(userToDelete.id);
          showToast('success', (userToDelete.status === 'pending') ? 'Đã từ chối yêu cầu' : 'Đã xóa tài khoản');
      }
      setDeleteModalOpen(false);
      setUserToDelete(null);
  };

  const handleApprove = (user: UserAccount) => {
      updateUserAccount({ ...user, status: 'active' });
      showToast('success', `Đã duyệt tài khoản ${user.username}`);
  };

  const handleOpenGrantModal = (data: { student: Student; name: string; phone: string }) => {
      setParentToGrant(data);
      // Pre-fill form with defaults
      setGrantFormData({
          fullName: data.name,
          username: data.phone,
          password: '123'
      });
      setGrantModalOpen(true);
  };

  const confirmGrant = (e: React.FormEvent) => {
      e.preventDefault();
      if (!parentToGrant) return;
      if (!grantFormData.username || !grantFormData.password) {
          showToast('error', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
          return;
      }

      const newAccount: UserAccount = {
          id: `ph_${parentToGrant.student.id}_${Date.now()}`,
          username: grantFormData.username,
          password: grantFormData.password, 
          fullName: grantFormData.fullName,
          role: Role.PARENT,
          studentId: parentToGrant.student.id,
          status: 'active'
      };

      addUserAccount(newAccount);
      showToast('success', `Đã cấp tài khoản thành công cho PH em ${parentToGrant.student.fullName}`);
      setGrantModalOpen(false);
      setParentToGrant(null);
  };

  // Pending count
  const pendingCount = userAccounts.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6">
       <ConfirmModal 
        isOpen={deleteModalOpen}
        title={userToDelete?.status === 'pending' ? "Từ chối yêu cầu" : "Xóa tài khoản"}
        message={userToDelete?.status === 'pending' 
            ? `Bạn có chắc chắn muốn từ chối yêu cầu đăng ký của ${userToDelete?.fullName}? Tài khoản sẽ bị xóa.`
            : `Bạn có chắc chắn muốn xóa tài khoản ${userToDelete?.username}? Hành động này sẽ thu hồi quyền truy cập.`
        }
        confirmLabel={userToDelete?.status === 'pending' ? "Từ chối & Xóa" : "Xóa"}
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {grantModalOpen && parentToGrant && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-blue-600">
                            <div className="p-2 bg-blue-100 rounded-full"><Key size={24}/></div>
                            <h3 className="text-xl font-bold">Cấp tài khoản Phụ huynh</h3>
                        </div>
                        <button onClick={() => setGrantModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        Thiết lập thông tin đăng nhập cho phụ huynh.
                    </p>

                    <form onSubmit={confirmGrant} className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase">Học sinh</p>
                                <p className="font-bold text-gray-800 text-sm">{parentToGrant.student.fullName}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Họ tên Phụ huynh</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                value={grantFormData.fullName}
                                onChange={e => setGrantFormData({...grantFormData, fullName: e.target.value})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tên đăng nhập</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-700 bg-blue-50/50"
                                        value={grantFormData.username}
                                        onChange={e => setGrantFormData({...grantFormData, username: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Mật khẩu</label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-red-600 bg-red-50/50"
                                        value={grantFormData.password}
                                        onChange={e => setGrantFormData({...grantFormData, password: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => setGrantModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm">Hủy</button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 text-sm">Xác nhận cấp</button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
      )}

       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Tài khoản</h1>
            <p className="text-gray-500 text-sm mt-1">Phân quyền truy cập cho giáo viên và phụ huynh.</p>
        </div>
        
        {/* Only show "Add" button for Teacher tabs */}
        {activeTab !== 'parent' && activeTab !== 'approval' && (
            <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
            <Plus size={18} />
            Thêm Tài Khoản
            </button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'parent' ? "Tìm theo tên PH, tên HS hoặc số điện thoại..." : "Tìm kiếm..."}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('subject')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'subject' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Briefcase size={16} /> GV Bộ Môn
          </button>
          <button 
            onClick={() => setActiveTab('parent')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'parent' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Users size={16} /> Phụ Huynh
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Shield size={16} /> BGH / GV Chủ Nhiệm
          </button>
          <button 
            onClick={() => setActiveTab('approval')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'approval' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Clock size={16} /> Tất cả chờ duyệt
              {pendingCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
          </button>
      </div>

      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {/* --- TEACHER & APPROVAL TABLES --- */}
        {(activeTab !== 'parent') && (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <th className="p-4 w-12 text-center">STT</th>
                        <th className="p-4">Họ và tên</th>
                        <th className="p-4">Tên đăng nhập</th>
                        <th className="p-4">Vai trò / Chuyên môn</th>
                        {(activeTab === 'approval' || activeTab === 'subject') && <th className="p-4 text-center">Trạng thái</th>}
                        <th className="p-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredAccounts.length > 0 ? filteredAccounts.map((user, index) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-center text-gray-500 font-medium text-sm">{index + 1}</td>
                            <td className="p-4 font-semibold text-gray-800 flex items-center gap-2 text-sm">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${user.status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                        <User size={16} />
                                    </div>
                                )}
                                {user.fullName}
                            </td>
                            <td className="p-4 text-gray-600 font-mono text-sm">{user.username}</td>
                            <td className="p-4 text-sm text-gray-600">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs uppercase tracking-tight text-gray-700">
                                        {user.role === Role.HOMEROOM ? 'GV Chủ nhiệm' : user.role === Role.PARENT ? 'Phụ huynh' : user.role === Role.STUDENT ? 'Học sinh' : 'GV Bộ môn'}
                                    </span>
                                    {user.department && <span className="text-xs text-gray-500">{user.department}</span>}
                                </div>
                            </td>
                            {(activeTab === 'approval' || activeTab === 'subject') && (
                                <td className="p-4 text-center">
                                    {user.status === 'pending' ? (
                                        <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">Chờ duyệt</span>
                                    ) : (
                                        <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={12} /> Active</span>
                                    )}
                                </td>
                            )}
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {user.status === 'pending' ? (
                                        <>
                                            <button onClick={() => openModal(user)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all" title="Chỉnh sửa thông tin">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleApprove(user)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all">
                                                <Check size={14} /> Duyệt
                                            </button>
                                            <button onClick={() => confirmDelete(user)} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all">
                                                Từ chối
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => openModal(user)} className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all" title="Sửa">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => confirmDelete(user)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" title="Xóa">
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-400 italic text-sm">
                                {activeTab === 'approval' ? 'Không có yêu cầu đăng ký nào đang chờ.' : 'Không tìm thấy tài khoản.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        )}

        {/* --- PARENT TABLE --- */}
        {activeTab === 'parent' && (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <th className="p-4 w-12 text-center">STT</th>
                        <th className="p-4 w-1/4">Học sinh</th>
                        <th className="p-4 w-1/4">Phụ huynh (Đại diện)</th>
                        <th className="p-4">SĐT (Tài khoản)</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {parentRows.length > 0 ? parentRows.map((row, idx) => (
                        <tr key={row.student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-center text-gray-400 text-sm font-medium">{idx + 1}</td>
                            <td className="p-4 font-semibold text-gray-800 text-sm">{row.student.fullName}</td>
                            <td className="p-4 text-gray-600 text-sm">{row.parentName}</td>
                            <td className="p-4 font-mono text-sm">
                                {row.isValidPhone ? row.phone : <span className="text-red-400 italic">Chưa có SĐT</span>}
                            </td>
                            <td className="p-4 text-center">
                                {row.existingAccount ? (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                                        <CheckCircle size={12} /> Đã cấp
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-bold border border-gray-200">
                                        Chưa cấp
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-right">
                                {row.existingAccount ? (
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => openModal(row.existingAccount)}
                                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600 font-medium"
                                        >
                                            Đặt lại MK
                                        </button>
                                        <button 
                                            onClick={() => confirmDelete(row.existingAccount!)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded" 
                                            title="Thu hồi tài khoản"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleOpenGrantModal({ student: row.student, name: row.parentName, phone: row.phone })}
                                        disabled={!row.isValidPhone}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 ml-auto
                                            ${row.isValidPhone 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                        `}
                                    >
                                        <Key size={14} /> Cấp tài khoản
                                    </button>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-400 italic text-sm">
                                Không tìm thấy dữ liệu phụ huynh phù hợp. <br/>
                                <span className="text-xs">Hãy đảm bảo danh sách học sinh đã có thông tin Cha/Mẹ/Người giám hộ.</span>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        )}
      </div>

      {/* CREATE/EDIT MODAL (TEACHER) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800">{editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
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

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Họ và Tên</label>
                    <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                        value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Tên đăng nhập</label>
                        <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" 
                            value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={!!editingUser} />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Mật khẩu</label>
                        <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" 
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="123456" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <div className="space-y-2">
                        {activeTab === 'admin' && (
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-blue-50 border-blue-200`}>
                                <div className="flex items-center gap-2 text-blue-800">
                                    <Shield size={16} />
                                    <span className="font-bold">Giáo viên Chủ Nhiệm / Admin</span>
                                </div>
                            </label>
                        )}
                        
                        {activeTab === 'subject' && (
                             <label className={`flex flex-col p-3 border rounded-lg cursor-pointer bg-purple-50 border-purple-200`}>
                                <div className="flex items-center gap-2 text-purple-800">
                                    <Briefcase size={16} />
                                    <span className="font-bold">Giáo viên Bộ Môn</span>
                                </div>
                                <div className="mt-3 animate-fade-in">
                                    <input 
                                        type="text" 
                                        placeholder="Nhập tổ chuyên môn (VD: Toán, Văn...)"
                                        className="w-full p-2 text-sm border border-purple-200 rounded bg-white focus:outline-none focus:border-purple-500"
                                        value={formData.department || ''}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    />
                                </div>
                            </label>
                        )}

                        {activeTab === 'parent' && editingUser && (
                             <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-green-50 border-green-200`}>
                                <div className="flex items-center gap-2 text-green-800">
                                    <Users size={16} />
                                    <span className="font-bold">Phụ Huynh Học Sinh</span>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button type="button" onClick={closeModal} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold uppercase transition-colors">Hủy</button>
                    <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold uppercase shadow-lg transition-all">Lưu thay đổi</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
