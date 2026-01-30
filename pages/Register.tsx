import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { User, Lock, ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { Role, UserAccount } from '../types';

const Register: React.FC = () => {
  const { registerUser, userAccounts, showToast } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
      fullName: '',
      username: '',
      password: '',
      role: Role.PARENT as Role // Default role
  });
  
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (userAccounts.some(u => u.username === formData.username)) {
        showToast('error', 'Tên đăng nhập đã tồn tại!');
        return;
    }

    if (formData.password.length < 3) {
        showToast('error', 'Mật khẩu phải có ít nhất 3 ký tự!');
        return;
    }

    const newUser: UserAccount = {
        id: `user_${Date.now()}`,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        status: 'pending' // Force pending
    };

    registerUser(newUser);
    setIsSuccess(true);
  };

  if (isSuccess) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Tài khoản của bạn đã được ghi nhận. <br/>
                    Vui lòng chờ <b>Giáo viên chủ nhiệm</b> phê duyệt để có thể đăng nhập.
                </p>
                <Link to="/login" className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
                    Quay lại Đăng nhập
                </Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
         <div className="p-8 pb-4">
             <div className="text-center mb-8">
                 <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký tài khoản</h2>
                 <p className="text-gray-500 text-sm">Nhập thông tin để tạo tài khoản mới</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1.5">
                     <label className="text-sm font-bold text-gray-700 ml-1">Họ và tên</label>
                     <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        placeholder="Nguyễn Văn A"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        required
                     />
                 </div>

                 <div className="space-y-1.5">
                     <label className="text-sm font-bold text-gray-700 ml-1">Tên đăng nhập</label>
                     <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        placeholder="Tên đăng nhập..."
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        required
                     />
                 </div>

                 <div className="space-y-1.5">
                     <label className="text-sm font-bold text-gray-700 ml-1">Mật khẩu</label>
                     <input 
                        type="password" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                     />
                 </div>

                 <div className="space-y-1.5">
                     <label className="text-sm font-bold text-gray-700 ml-1">Vai trò</label>
                     <div className="grid grid-cols-2 gap-3">
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, role: Role.SUBJECT})}
                            className={`py-3 rounded-lg text-sm font-bold border transition-all ${formData.role === Role.SUBJECT ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                         >
                             GIÁO VIÊN BỘ MÔN
                         </button>
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, role: Role.PARENT})}
                            className={`py-3 rounded-lg text-sm font-bold border transition-all ${formData.role === Role.PARENT ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                         >
                             PHỤ HUYNH
                         </button>
                     </div>
                 </div>

                 <button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 mt-4"
                 >
                    <UserPlus size={20} /> Đăng Ký
                 </button>
             </form>
         </div>
         
         <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-green-700 font-medium flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
         </div>
      </div>
    </div>
  );
};

export default Register;