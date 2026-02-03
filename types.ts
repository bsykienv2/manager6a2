
export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
}

export type StudentStatus = 'studying' | 'dropped_out' | 'transfer'; // Đang học | Nghỉ học | Chuyển trường

export enum Role {
  HOMEROOM = 'HOMEROOM', // Giáo viên chủ nhiệm (Admin)
  SUBJECT = 'SUBJECT',   // Giáo viên bộ môn (Viewer)
  PARENT = 'PARENT',     // Phụ huynh (Limited Viewer)
  STUDENT = 'STUDENT',   // Học sinh (Limited Viewer)
}

export interface User {
  username: string;
  fullName: string;
  role: Role;
  avatar?: string; // NEW: Ảnh đại diện
}

export interface UserAccount extends User {
  id: string;
  password?: string;
  studentId?: string; // ID học sinh liên kết (dành cho phụ huynh)
  department?: string;
  status?: 'active' | 'pending'; // Trạng thái tài khoản
}

// Dữ liệu chi tiết của một kỳ học
export interface TermData {
  scores: Record<string, any>; // Điểm số các môn
  academicRank?: string; // Xếp loại học lực
  conduct?: string; // Hạnh kiểm
  award?: string; // Danh hiệu thi đua
  academicNotes?: string; // NEW: Nhận xét (chuyển vào đây để rõ ràng hơn)
}

export interface Student {
  id: string;
  fullName: string; // Vẫn giữ để tương thích display chung
  firstName: string; // Tên (để sắp xếp)
  lastName: string;  // Họ và tên đệm
  avatar?: string; // NEW: Ảnh đại diện (Base64 string)
  
  gender: Gender;
  dateOfBirth: string;
  placeOfBirth?: string; // NEW: Nơi sinh
  address: string;
  
  // NEW: Trạng thái học tập
  status?: StudentStatus;

  // NEW: Căn cước công dân / Mã định danh
  cccd?: string;
  // NEW: Dân tộc
  ethnicity?: string;

  // OLD: Giữ lại để tương thích ngược nếu cần (nhưng logic mới sẽ ưu tiên các trường chi tiết bên dưới)
  parentName?: string;
  parentPhone?: string;

  // NEW: Thông tin chi tiết gia đình
  fatherName?: string;
  fatherYearOfBirth?: string; // NEW: Năm sinh Cha
  fatherPhone?: string;
  fatherJob?: string;

  motherName?: string;
  motherYearOfBirth?: string; // NEW: Năm sinh Mẹ
  motherPhone?: string;
  motherJob?: string;

  guardianName?: string;
  guardianPhone?: string;
  guardianJob?: string;

  // Các trường cũ (Flat fields - Legacy support)
  academicRank?: string; 
  conduct?: string;
  award?: string;
  notes?: string; 
  academicNotes?: string; 
  conductNotes?: string;
  subjectScores?: Record<string, any>; 

  // Bảng điểm chi tiết theo kỳ
  transcript?: {
    HK1?: TermData;
    HK2?: TermData;
    CN?: TermData;
  };
}

export interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'excused' | 'unexcused';
  note?: string;
}

export interface DailyAttendance {
  date: string;
  records: AttendanceRecord[];
}

export interface ScoreCommentConfig {
  id: string;
  min?: number; // Optional now
  max?: number; // Optional now
  rank?: string; // NEW: Xếp loại (Tốt, Khá, Đạt, Chưa đạt)
  content: string;
  term?: 'HK1' | 'HK2' | 'CN'; // NEW: Kỳ học áp dụng
}

export interface ClassInfo {
  className: string;
  teacherName: string;
  schoolYear: string;
  schoolName?: string;
  location?: string;
  awardTitles?: string[];
  scoreComments?: ScoreCommentConfig[]; // NEW: Cấu hình nhận xét theo điểm
  teacherSignature?: string; // NEW: Chữ ký giáo viên (Base64)
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'warning' | 'urgent';
  category?: 'class' | 'personal' | 'message'; // Added 'message' type
  senderName?: string; // Optional for message type notifications
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export type ReviewType = 'WEEKLY' | 'MONTHLY' | 'TERM';

export interface Review {
  id: string;
  studentId: string;
  type: ReviewType;
  periodName: string;
  content: string;
  date: string;
}

export interface Attachment {
  type: 'image' | 'file';
  url: string; // Base64 for demo
  name: string;
  size?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // 'teacher' OR studentId (parent linked to student)
  content: string;
  attachments?: Attachment[];
  timestamp: string;
  isRead: boolean;
}
