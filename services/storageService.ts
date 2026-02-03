
import { Student, Gender, ClassInfo, DailyAttendance, NotificationItem, User, UserAccount, Role, Review } from '../types';

const STORAGE_KEYS = {
  SYSTEM_INIT: 'lhs_system_initialized_v2', // Cờ kiểm tra lần đầu chạy app
  STUDENTS: 'lhs_students',
  CLASS_INFO: 'lhs_class_info',
  ATTENDANCE: 'lhs_attendance',
  NOTIFICATIONS: 'lhs_notifications',
  DASHBOARD_NOTE: 'lhs_dashboard_note',
  CURRENT_USER: 'lhs_current_user', 
  USERS: 'lhs_users_list_v2', 
  REVIEWS: 'lhs_reviews', 
  API_URL: 'lhs_api_url', // NEW: Key cho API URL
};

// Đặt rỗng để buộc người dùng nhập URL mới
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyYlYm0BxW5V05b8tCcdoU9ms-oUKJ2MyV4zZ5bff85jcovuOC3AxtHvazwRrnNhg71NA/exec'; 

const safeParse = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "null" || item === undefined) return defaultValue;
    const parsed = JSON.parse(item);
    // Nếu parse ra mảng rỗng mà defaultValue là mảng có phần tử (như INITIAL_USERS), trả về defaultValue để khôi phục
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultValue) && (defaultValue as any[]).length > 0) {
        return defaultValue;
    }
    return parsed === null ? defaultValue : parsed;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// EXPORT THIS CONSTANT SO APP CONTEXT CAN USE IT
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'admin_1',
    username: 'admin',
    password: '123', 
    fullName: 'Bùi Sỹ Kiên (GVCN)',
    role: Role.HOMEROOM,
    status: 'active'
  },
  {
    id: 'teacher_1',
    username: 'gv_bomon',
    password: '123', 
    fullName: 'GV Bộ Môn (Mẫu)',
    role: Role.SUBJECT,
    department: 'Khoa học Tự nhiên',
    status: 'active'
  },
  {
    id: 'parent_1',
    username: 'phuhuynh',
    password: '123', 
    fullName: 'Phụ huynh (Mẫu)',
    role: Role.PARENT,
    studentId: 'HS001',
    status: 'active'
  }
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'HS001',
    firstName: 'An',
    lastName: 'Nguyễn Văn',
    fullName: 'Nguyễn Văn An',
    gender: Gender.MALE,
    dateOfBirth: '2010-05-12',
    placeOfBirth: 'TP.HCM',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    cccd: '079201000001',
    ethnicity: 'Kinh',
    status: 'studying',
    fatherName: 'Nguyễn Văn Bình',
    fatherPhone: '0901234567',
    motherName: 'Lê Thị Mai',
    motherPhone: '0909888777',
    transcript: {
        HK1: {
            scores: { "Toán": 8.5, "Ngữ văn": 8.0, "Ngoại ngữ": 9.0, "GDCD": 9.0, "KHTN": 8.5, "LS-ĐL": 8.0, "Công nghệ": 9.0, "Tin học": 9.5, "GDTC": "Đ", "Nghệ thuật": "Đ", "HĐTN": "Đ", "GDĐP": "Đ" },
            academicRank: 'Tốt',
            conduct: 'Tốt'
        }
    }
  }
];

const INITIAL_CLASS_INFO: ClassInfo = {
  className: '9A1',
  teacherName: 'Bùi Sỹ Kiên',
  schoolYear: '2023-2024',
  schoolName: 'TRƯỜNG THCS TÂN LẬP',
  location: 'Đồng Phú',
  awardTitles: ['Học sinh Xuất sắc', 'Học sinh Giỏi', 'Khen thưởng thành tích đột xuất'],
  scoreComments: [
      // HK1
      { id: 'hk1_1', rank: 'Tốt', content: 'Chăm ngoan, học giỏi, có ý thức xây dựng bài. Tiếp tục phát huy nhé!', term: 'HK1' },
      { id: 'hk1_2', rank: 'Khá', content: 'Có cố gắng trong học tập, ngoan hiền. Cần chủ động phát biểu hơn.', term: 'HK1' },
      { id: 'hk1_3', rank: 'Đạt', content: 'Sức học trung bình, cần chăm chỉ làm bài tập về nhà hơn.', term: 'HK1' },
      { id: 'hk1_4', rank: 'Chưa đạt', content: 'Học lực còn yếu, cần cố gắng rất nhiều. Gia đình cần quan tâm đôn đốc.', term: 'HK1' },
      // HK2
      { id: 'hk2_1', rank: 'Tốt', content: 'Hoàn thành xuất sắc nhiệm vụ học kỳ 2. Là tấm gương sáng cho cả lớp.', term: 'HK2' },
      { id: 'hk2_2', rank: 'Khá', content: 'Có tiến bộ rõ rệt so với học kỳ 1. Cần duy trì phong độ.', term: 'HK2' },
      { id: 'hk2_3', rank: 'Đạt', content: 'Đã có cố gắng nhưng kết quả chưa cao. Cần ôn tập kỹ kiến thức hè.', term: 'HK2' },
      // Cả Năm
      { id: 'cn_1', rank: 'Tốt', content: 'Đạt danh hiệu Học sinh Giỏi cả năm. Chúc mừng em!', term: 'CN' },
      { id: 'cn_2', rank: 'Khá', content: 'Hoàn thành tốt năm học. Cần nỗ lực hơn để đạt kết quả cao hơn năm sau.', term: 'CN' },
      { id: 'cn_3', rank: 'Đạt', content: 'Được lên lớp. Cần rèn luyện thêm trong hè để chuẩn bị cho năm học mới.', term: 'CN' },
      { id: 'cn_4', rank: 'Chưa đạt', content: 'Kết quả năm học chưa đạt yêu cầu. Cần thi lại hoặc rèn luyện thêm trong hè.', term: 'CN' }
  ]
};

// Hàm khởi tạo dữ liệu mẫu CHỈ chạy 1 lần duy nhất khi cài đặt
const initializeSystem = () => {
    const isInit = localStorage.getItem(STORAGE_KEYS.SYSTEM_INIT);
    // Force init if users key is missing or empty string
    const usersExist = localStorage.getItem(STORAGE_KEYS.USERS);
    
    if (!isInit || !usersExist || usersExist === '[]') {
        // Chưa khởi tạo hoặc dữ liệu bị hỏng -> Nạp dữ liệu mẫu
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        
        if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        if (!localStorage.getItem(STORAGE_KEYS.CLASS_INFO)) localStorage.setItem(STORAGE_KEYS.CLASS_INFO, JSON.stringify(INITIAL_CLASS_INFO));
        if (!localStorage.getItem(STORAGE_KEYS.API_URL)) localStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
        
        // Đánh dấu đã khởi tạo
        localStorage.setItem(STORAGE_KEYS.SYSTEM_INIT, 'true');
    } else {
        // Nếu đã khởi tạo nhưng chưa có API URL (do update version), set default
        if (!localStorage.getItem(STORAGE_KEYS.API_URL)) {
            localStorage.setItem(STORAGE_KEYS.API_URL, DEFAULT_API_URL);
        }
    }
};

// Gọi ngay khi module load
initializeSystem();

export const getUsersList = (): UserAccount[] => {
  // Pass INITIAL_USERS as default. safeParse handles empty array check.
  return safeParse<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
};

export const saveUsersList = (users: UserAccount[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStudents = (): Student[] => {
  const students = safeParse<Student[]>(STORAGE_KEYS.STUDENTS, []);
  return students.map(s => {
    const fullNameSafe = s.fullName || '';
    // Tự động tách tên nếu thiếu
    if (!s.firstName || !s.lastName) {
      const parts = fullNameSafe.trim().split(' ');
      const firstName = parts.pop() || '';
      const lastName = parts.join(' ');
      return { ...s, fullName: fullNameSafe, firstName, lastName };
    }
    return { ...s, fullName: fullNameSafe };
  });
};

export const saveStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getClassInfo = (): ClassInfo => {
  return safeParse<ClassInfo>(STORAGE_KEYS.CLASS_INFO, INITIAL_CLASS_INFO);
};

export const saveClassInfo = (info: ClassInfo): void => {
  localStorage.setItem(STORAGE_KEYS.CLASS_INFO, JSON.stringify(info));
};

export const getAttendanceHistory = (): DailyAttendance[] => {
  return safeParse<DailyAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
};

export const saveAttendance = (dailyRecord: DailyAttendance): void => {
  const history = getAttendanceHistory();
  const index = history.findIndex(r => r.date === dailyRecord.date);
  if (index >= 0) history[index] = dailyRecord;
  else history.push(dailyRecord);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(history));
};

export const saveAttendanceHistory = (history: DailyAttendance[]): void => {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(history));
};

export const getNotifications = (): NotificationItem[] => {
  return safeParse<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
};

export const saveNotifications = (notes: NotificationItem[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notes));
};

export const getDashboardNote = (): string => {
  return localStorage.getItem(STORAGE_KEYS.DASHBOARD_NOTE) || '';
};

export const saveDashboardNote = (note: string): void => {
  localStorage.setItem(STORAGE_KEYS.DASHBOARD_NOTE, note);
};

export const getCurrentUser = (): UserAccount | null => {
  return safeParse<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
};

export const saveCurrentUser = (user: UserAccount | null): void => {
  if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getReviews = (): Review[] => {
  return safeParse<Review[]>(STORAGE_KEYS.REVIEWS, []);
};

export const saveReviews = (reviews: Review[]): void => {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
};

// NEW: API URL Management
export const getApiUrl = (): string => {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL;
};

export const saveApiUrl = (url: string): void => {
  localStorage.setItem(STORAGE_KEYS.API_URL, url);
};
