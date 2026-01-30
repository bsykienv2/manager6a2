import React, { useState } from 'react';
import { Sparkles, MessageSquare, FileText, Send, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { generateStudentReport, generateMeetingInvitation } from '../services/geminiService';

const AiAssistant: React.FC = () => {
  // Lấy dữ liệu học sinh từ Context
  const { students } = useApp();
  
  const [activeTab, setActiveTab] = useState<'report' | 'meeting'>('report');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // States for Meeting
  const [meetingTopic, setMeetingTopic] = useState('Tổng kết Học kỳ 1');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('08:00');
  const [meetingLoc, setMeetingLoc] = useState('Phòng học lớp 9A1');

  // Loading & Result
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerateReport = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    setIsLoading(true);
    setResult('');
    const text = await generateStudentReport(
      student.fullName, 
      student.conduct || 'Khá', 
      student.notes || ''
    );
    setResult(text);
    setIsLoading(false);
  };

  const handleGenerateMeeting = async () => {
    setIsLoading(true);
    setResult('');
    const text = await generateMeetingInvitation(meetingTopic, meetingDate, meetingTime, meetingLoc);
    setResult(text);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-2xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-yellow-300" />
            <h1 className="text-2xl font-bold">Trợ Lý Ảo Gemini</h1>
        </div>
        <p className="text-indigo-100 opacity-90">Sử dụng trí tuệ nhân tạo để hỗ trợ công việc soạn thảo văn bản, nhận xét học sinh nhanh chóng.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => { setActiveTab('report'); setResult(''); }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-center gap-2">
                <FileText size={18} />
                Nhận xét Học bạ
            </div>
          </button>
          <button 
            onClick={() => { setActiveTab('meeting'); setResult(''); }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'meeting' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
             <div className="flex items-center justify-center gap-2">
                <MessageSquare size={18} />
                Soạn tin nhắn họp PH
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn học sinh cần nhận xét</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={!selectedStudentId || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 w-full justify-center transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {isLoading ? 'Đang suy nghĩ...' : 'Tạo nhận xét tự động'}
              </button>
            </div>
          )}

          {activeTab === 'meeting' && (
            <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề cuộc họp</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={meetingTopic} onChange={e => setMeetingTopic(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={meetingLoc} onChange={e => setMeetingLoc(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                    <input type="date" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ</label>
                    <input type="time" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={meetingTime} onChange={e => setMeetingTime(e.target.value)} />
                  </div>
               </div>
               <button 
                onClick={handleGenerateMeeting}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 w-full justify-center transition-all mt-4"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                {isLoading ? 'Đang soạn thảo...' : 'Soạn tin nhắn mời'}
              </button>
            </div>
          )}

          {/* Result Area */}
          {result && (
            <div className="mt-8 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-lg font-semibold text-gray-800">Kết quả từ AI:</h3>
                 <button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                 >
                    Sao chép
                 </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;