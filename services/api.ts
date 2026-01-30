
import { Student, DailyAttendance, NotificationItem, UserAccount, ClassInfo, Review } from '../types';
import { getApiUrl } from './storageService';

// Helper function to call Google Apps Script
const callGoogleScript = async (action: string, payload: any = {}) => {
  try {
    const apiUrl = getApiUrl();
    if (!apiUrl || apiUrl === 'undefined' || apiUrl === 'null' || apiUrl.trim() === '') {
       console.warn("API URL not configured in Settings.");
       // Trả về null để UI không crash, app sẽ chạy ở chế độ offline (local only)
       return null;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
      // Quan trọng: text/plain để tránh preflight request (CORS) của Google
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
    
    // Đọc text trước để kiểm tra xem có phải là lỗi HTML/Text từ Google không
    const text = await response.text();
    let json;
    
    try {
        json = JSON.parse(text);
    } catch (e) {
        // Nếu response chứa chuỗi đặc trưng của doGet hoặc lỗi HTML
        if (text.includes("Lớp Học Số API is running") || text.includes("<!DOCTYPE html>")) {
             console.error("API Response Error (Not JSON):", text);
             throw new Error("Lỗi kết nối: URL API có thể không chính xác hoặc Script chưa được Deploy đúng quyền 'Anyone'. Vui lòng kiểm tra Cài đặt.");
        }
        console.error("Invalid JSON:", text);
        throw new Error("Dữ liệu trả về từ máy chủ không hợp lệ.");
    }

    if (!json.ok) throw new Error(json.error || 'Unknown API Error');
    return json.data;
  } catch (error: any) {
    console.error(`API Call Failed [${action}]:`, error);
    throw error; // Ném lỗi để UI (toast) hiển thị
  }
};

export const api = {
  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    const rawData = await callGoogleScript('students.list');
    if (!rawData) return [];
    
    return rawData.map((s: any) => {
        let transcript = {};
        try {
            // Hỗ trợ cả trường metadata cũ và transcript mới
            const meta = s.metadata || s.transcript_json || s.transcript;
            if (meta && typeof meta === 'string') transcript = JSON.parse(meta);
            else if (meta && typeof meta === 'object') transcript = meta;
        } catch (e) { console.error('Error parsing transcript JSON', e); }

        return {
            ...s,
            dateOfBirth: s.birthday || s.dateOfBirth || '',
            parentPhone: s.parentPhone || s.fatherPhone || s.motherPhone || '',
            transcript
        };
    });
  },
  
  createStudent: (student: Student) => {
      // Clone để không ảnh hưởng object gốc
      const payload = { ...student };
      // Map lại một số trường cho khớp backend cũ nếu cần
      (payload as any).birthday = student.dateOfBirth;
      // Stringify transcript để lưu vào 1 cột metadata
      (payload as any).metadata = JSON.stringify(student.transcript || {});
      delete (payload as any).transcript; 
      
      return callGoogleScript('students.create', payload);
  },

  updateStudent: (student: Student) => {
      const payload = { ...student };
      (payload as any).birthday = student.dateOfBirth;
      (payload as any).metadata = JSON.stringify(student.transcript || {});
      delete (payload as any).transcript;
      
      return callGoogleScript('students.update', payload);
  },

  deleteStudent: (id: string) => callGoogleScript('students.delete', { id }),

  // --- ATTENDANCE ---
  getAttendance: async (): Promise<DailyAttendance[]> => {
      const flatRecords = await callGoogleScript('attendance.list');
      if (!flatRecords) return [];

      const grouped: Record<string, any[]> = {};
      
      flatRecords.forEach((r: any) => {
          // Chuẩn hóa ngày tháng
          const dateKey = r.date ? r.date.split('T')[0] : ''; 
          if (!dateKey) return;

          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push({
              studentId: r.studentId,
              status: r.status,
              note: r.note
          });
      });

      return Object.keys(grouped).map(date => ({
          date,
          records: grouped[date]
      }));
  },

  // GAS supports array of records in attendance.create
  createAttendanceRecord: (records: any[]) => callGoogleScript('attendance.create', records),
  
  // --- USERS (Parents/Teachers) ---
  getUsers: async () => {
      const res = await callGoogleScript('parents.list');
      return res || [];
  },
  createUser: (user: UserAccount) => callGoogleScript('parents.create', user),
  updateUser: (user: UserAccount) => callGoogleScript('parents.update', user),
  deleteUser: (id: string) => callGoogleScript('parents.delete', { id }),

  // --- NOTIFICATIONS ---
  getNotifications: async () => {
      const res = await callGoogleScript('announcements.list');
      return res || [];
  },
  createNotification: (note: NotificationItem) => callGoogleScript('announcements.create', note),
  deleteNotification: (id: string) => callGoogleScript('announcements.delete', { id }),

  // --- REVIEWS ---
  getReviews: async () => {
      const res = await callGoogleScript('behavior.list');
      return res || [];
  },
  createReview: (review: Review) => callGoogleScript('behavior.create', review),
  deleteReview: (id: string) => callGoogleScript('behavior.delete', { id }),

  // --- CLASS INFO (CONFIG) ---
  getClassInfo: async (): Promise<ClassInfo | null> => {
      const data = await callGoogleScript('classes.list');
      if (!data) return null;

      if (Array.isArray(data) && data.length > 0) {
          // Lấy dòng cuối cùng (cấu hình mới nhất)
          const cls = data[data.length - 1]; 
          if (cls && cls.className) {
              return {
                  className: cls.className || '',
                  teacherName: cls.teacherName || '',
                  schoolYear: cls.year || cls.schoolYear || '',
                  schoolName: cls.schoolName || cls.description || '',
                  location: cls.location || '',
                  awardTitles: cls.awardTitles ? (typeof cls.awardTitles === 'string' ? JSON.parse(cls.awardTitles) : cls.awardTitles) : [],
                  scoreComments: cls.scoreComments ? (typeof cls.scoreComments === 'string' ? JSON.parse(cls.scoreComments) : cls.scoreComments) : [],
                  teacherSignature: cls.teacherSignature || '' // Load signature
              };
          }
      }
      return null;
  },
  
  // Update Config by sending full object to create/update
  updateConfig: (info: ClassInfo) => {
      const payload = {
          ...info,
          year: info.schoolYear,
          awardTitles: JSON.stringify(info.awardTitles),
          scoreComments: JSON.stringify(info.scoreComments)
          // teacherSignature is already in 'info' object, will be sent automatically
      };
      // Sử dụng update để ghi đè cấu hình
      return callGoogleScript('classes.update', payload);
  }
};
