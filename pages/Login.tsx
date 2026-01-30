import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { BookOpen, User, Lock, ArrowRight, AlertCircle, Phone, Facebook, Plus, Clock, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login, currentUser, syncStatus, refreshData } = useApp();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      // If already logged in, redirect to dashboard
      if (currentUser) {
          navigate('/');
      }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for UX
    setTimeout(() => {
        const result = login(username.trim(), password.trim());
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Có lỗi xảy ra.');
        }
        setIsLoading(false);
    }, 500);
  };

  const getStatusUI = () => {
      if (syncStatus === 'syncing') {
          return (
              <div className="flex items-center gap-3">
                 <RefreshCw size={14} className="animate-spin text-yellow-300" />
                 <span className="font-semibold text-sm text-white">Đang đồng bộ dữ liệu...</span>
              </div>
          );
      }
      if (syncStatus === 'success') {
          return (
             <div className="flex items-center gap-3">
                 <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </div>
                 <span className="font-semibold text-sm text-white">Hệ thống hoạt động ổn định</span>
             </div>
          );
      }
      if (syncStatus === 'error') {
          return (
              <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-red-300">
                     <WifiOff size={14} />
                     <span className="font-semibold text-sm">Mất kết nối máy chủ</span>
                  </div>
                  <button onClick={refreshData} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors">
                      Thử lại
                  </button>
              </div>
          );
      }
      return <span className="text-sm text-gray-300">Sẵn sàng</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
         {/* Left Side - Blue Panel */}
         <div className="md:w-1/2 bg-[#0078D4] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

             <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BookOpen size={24} className="text-white" />
                     </div>
                     <span className="text-xl font-bold uppercase tracking-wider">LMS EDUCATION</span>
                 </div>
                 <div className="mt-12 space-y-4">
                     <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        Hệ thống quản lý<br/>
                        <span className="text-yellow-300">Học tập & Nề nếp</span>
                     </h1>
                     <p className="text-blue-100 text-lg leading-relaxed max-w-md">
                        Nền tảng quản lý lớp học trực tuyến toàn diện, hiện đại dành cho giáo viên chủ nhiệm, phụ huynh và học sinh.
                     </p>
                 </div>
             </div>

             <div className="relative z-10 mt-8">
                 <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 inline-block w-full max-w-xs transition-all hover:bg-white/15">
                     <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-2">TRẠNG THÁI KẾT NỐI</p>
                     {getStatusUI()}
                 </div>
             </div>
         </div>

         {/* Right Side - Login Form */}
         <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
             <div className="text-center mb-10">
                 <h2 className="text-3xl font-bold text-gray-800 mb-3">Đăng nhập</h2>
                 <p className="text-gray-500">Nhập thông tin tài khoản của bạn để truy cập</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                 {error && (
                     <div className={`p-4 rounded-xl text-sm flex items-center gap-2 border animate-fade-in ${error.includes('chờ') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                         {error.includes('chờ') ? <Clock size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
                         {error}
                     </div>
                 )}
                 
                 <div className="space-y-2">
                     <label className="text-sm font-semibold text-gray-700 ml-1">Tên đăng nhập (Username)</label>
                     <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                             <User className="text-gray-400 group-focus-within:text-[#0078D4] transition-colors" size={20} />
                         </div>
                         <input 
                            type="text" 
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0078D4] focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 font-medium"
                            placeholder="VD: an.nv"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                         />
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu (Password)</label>
                     <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                             <Lock className="text-gray-400 group-focus-within:text-[#0078D4] transition-colors" size={20} />
                         </div>
                         <input 
                            type="password" 
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0078D4] focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                         />
                     </div>
                 </div>

                 <button 
                    type="submit" 
                    disabled={isLoading || syncStatus === 'syncing'}
                    className="w-full bg-[#0078D4] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                 >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            Đăng nhập <ArrowRight size={20} />
                        </>
                    )}
                 </button>
             </form>

             <div className="mt-8 flex items-center justify-between text-sm text-gray-500 pt-6 border-t border-gray-100">
                <span>Chưa có tài khoản?</span>
                <Link to="/register" className="font-bold text-[#0078D4] hover:underline flex items-center gap-1 transition-colors">
                   <Plus size={16} /> Đăng ký ngay
                </Link>
             </div>
         </div>
      </div>

      {/* Footer Credits */}
      <div className="mt-8 text-center space-y-2 animate-fade-in-up">
        <p className="text-gray-500 text-sm font-medium">Thiết kế và phát triển bởi: <span className="font-bold text-gray-700">Bùi Sỹ Kiên - 0392674477</span></p>
        <p className="text-[#0078D4] font-bold uppercase text-sm">Trường THCS Tân Lập (Đồng Phú, Đồng Nai)</p>
        
        <div className="flex items-center justify-center gap-3 mt-4">
             <a href="tel:0392674477" className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-[#0078D4] hover:shadow-md transition-all text-xs font-bold border border-gray-200">
                 <Phone size={14} className="text-[#0078D4]" /> Zalo/ĐT: 0392674477
             </a>
             <a href="https://www.facebook.com/keinsybui/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-700 hover:shadow-md transition-all text-xs font-bold border border-gray-200">
                 <Facebook size={14} className="text-blue-700" /> Facebook
             </a>
        </div>
      </div>
    </div>
  );
};

export default Login;