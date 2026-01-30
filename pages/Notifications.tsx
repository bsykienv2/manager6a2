import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { NotificationItem } from '../types';
import { Bell, Plus, Trash2, Calendar, AlertCircle, Bookmark, Users, Lock } from 'lucide-react';

const Notifications: React.FC = () => {
  const { notifications, addNotification, deleteNotification } = useApp();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'class' | 'personal'>('all');
  
  const [newNote, setNewNote] = useState<Partial<NotificationItem>>({
      title: '',
      content: '',
      type: 'info',
      category: 'class', // Default
      date: new Date().toISOString().split('T')[0]
  });

  const handleDelete = (id: string) => {
      if(confirm('Bạn có chắc chắn muốn xóa không?')) {
          deleteNotification(id);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const note: NotificationItem = {
          ...newNote as NotificationItem,
          id: Date.now().toString(),
          category: newNote.category || 'class'
      };
      
      addNotification(note);
      setIsFormOpen(false);
      setNewNote({ 
          title: '', 
          content: '', 
          type: 'info', 
          category: 'class', 
          date: new Date().toISOString().split('T')[0] 
      });
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
          case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
          default: return 'bg-blue-50 text-blue-700 border-blue-200';
      }
  };

  const filteredNotifications = notifications.filter(n => {
      if (activeTab === 'all') return true;
      // Handle legacy items without category as 'class'
      const cat = n.category || 'class';
      return cat === activeTab;
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông Báo & Ghi Chú</h1>
                <p className="text-gray-500 mt-1">Quản lý thông báo lớp học và ghi chú cá nhân của giáo viên.</p>
            </div>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
                <Plus size={18} />
                Tạo Mới
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Tất cả
            </button>
            <button 
                onClick={() => setActiveTab('class')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'class' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Users size={16} /> Thông báo lớp
            </button>
            <button 
                onClick={() => setActiveTab('personal')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Lock size={16} /> Ghi chú cá nhân
            </button>
        </div>

        {isFormOpen && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg animate-fade-in-down">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Soạn nội dung mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                             <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                             <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setNewNote({...newNote, category: 'class'})}
                                    className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${newNote.category === 'class' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}
                                >
                                    <Users size={16} /> Thông báo lớp
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setNewNote({...newNote, category: 'personal'})}
                                    className={`p-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${newNote.category === 'personal' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-600'}`}
                                >
                                    <Lock size={16} /> Ghi chú riêng
                                </button>
                             </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                             <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={newNote.type} onChange={e => setNewNote({...newNote, type: e.target.value as any})}>
                                 <option value="info">Bình thường (Thông tin)</option>
                                 <option value="warning">Lưu ý quan trọng</option>
                                 <option value="urgent">Khẩn cấp / Gấp</option>
                             </select>
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                         <textarea required rows={4} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})}></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Hủy</button>
                        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors">Lưu lại</button>
                    </div>
                </form>
            </div>
        )}

        <div className="grid grid-cols-1 gap-4">
            {filteredNotifications.length > 0 ? (
                filteredNotifications.map(note => {
                    const isPersonal = note.category === 'personal';
                    return (
                        <div key={note.id} className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow relative group ${isPersonal ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    {isPersonal ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1">
                                            <Lock size={10} /> Cá nhân
                                        </span>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getTypeColor(note.type)}`}>
                                            {note.type === 'urgent' ? 'Khẩn cấp' : note.type === 'warning' ? 'Lưu ý' : 'Thông tin'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-400 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(note.date).toLocaleDateString('vi-VN')}
                                    </span>
                                    <button onClick={() => handleDelete(note.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isPersonal ? 'text-gray-800' : 'text-gray-900'}`}>
                                {note.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{note.content}</p>
                            
                            {/* Visual hint for personal notes */}
                            {isPersonal && (
                                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-xl">
                                    <div className="bg-yellow-300/50 absolute transform rotate-45 translate-x-1/2 -translate-y-1/2 w-full h-full shadow-sm"></div>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Bell className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">Chưa có nội dung nào trong danh mục này.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Notifications;