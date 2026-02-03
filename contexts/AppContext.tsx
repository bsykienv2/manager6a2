
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Student, ClassInfo, DailyAttendance, NotificationItem, User, Role, ToastMessage, ToastType, UserAccount, Review, Message
} from '../types';
import * as Storage from '../services/storageService';
import { api } from '../services/api';

// Định nghĩa kiểu dữ liệu cho Context
interface AppContextType {
  isLoading: boolean; // Trạng thái tải dữ liệu
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'; // Trạng thái đồng bộ chi tiết
  lastSyncTime: Date | null;

  // Authentication & Account Management
  currentUser: UserAccount | null; // Changed from User to UserAccount
  userAccounts: UserAccount[]; // List of all accounts
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  registerUser: (user: UserAccount) => void;
  addUserAccount: (user: UserAccount) => void;
  updateUserAccount: (user: UserAccount) => void;
  deleteUserAccount: (id: string) => void;

  // 1. Thông tin lớp học
  classInfo: ClassInfo;
  updateClassInfo: (info: ClassInfo) => void;

  // 2. Danh sách học sinh
  students: Student[];
  addStudent: (student: Student) => void;
  addStudents: (students: Student[]) => void;
  updateStudent: (student: Student) => void;
  updateStudents: (students: Student[]) => void; // NEW: Bulk update
  deleteStudent: (id: string) => void;
  clearAllStudents: () => void; // NEW: Bulk delete all

  // 3. Điểm danh
  attendanceHistory: DailyAttendance[];
  saveDailyAttendance: (record: DailyAttendance) => void;
  getAttendanceRecord: (date: string) => DailyAttendance | undefined;

  // 4. Thông báo & Ghi chú
  notifications: NotificationItem[];
  addNotification: (note: NotificationItem) => void;
  deleteNotification: (id: string) => void;
  
  // 5. Ghi chú nhanh (Dashboard)
  dashboardNote: string;
  updateDashboardNote: (note: string) => void;

  // 6. Nhận xét định kỳ
  reviews: Review[];
  addReview: (review: Review) => void;
  deleteReview: (id: string) => void;

  // 7. Tin nhắn
  messages: Message[];
  sendMessage: (msg: Message) => void;

  // 8. Cấu hình hệ thống (API URL)
  apiUrl: string;
  updateApiUrl: (url: string) => void;

  // 9. Toasts (Thông báo hệ thống)
  toasts: ToastMessage[];
  showToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;

  // Tiện ích
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Loading chỉ dùng cho các tác vụ blocking, không dùng cho initial load nếu đã có data local
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // --- STATE KHỞI TẠO (Lấy từ LocalStorage để hiển thị ngay lập tức - Offline First) ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(Storage.getCurrentUser());
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(Storage.getUsersList());
  
  const [classInfo, setClassInfo] = useState<ClassInfo>(Storage.getClassInfo());
  const [students, setStudents] = useState<Student[]>(Storage.getStudents());
  const [attendanceHistory, setAttendanceHistory] = useState<DailyAttendance[]>(Storage.getAttendanceHistory());
  const [notifications, setNotifications] = useState<NotificationItem[]>(Storage.getNotifications());
  const [dashboardNote, setDashboardNote] = useState<string>(Storage.getDashboardNote());
  const [reviews, setReviews] = useState<Review[]>(Storage.getReviews());
  const [messages, setMessages] = useState<Message[]>(Storage.getMessages()); // NEW
  const [apiUrl, setApiUrl] = useState<string>(Storage.getApiUrl());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper: Đảm bảo người dùng quản trị luôn tồn tại và KHÔNG TRÙNG LẶP
  // Updated with Trim and stricter normalization
  const ensurePrivilegedUsers = (users: UserAccount[]): UserAccount[] => {
      // 1. Clean existing users: Trim usernames and ensure string
      const cleanedUsers = users.map(u => ({
          ...u,
          username: (u.username || '').toString().trim()
      }));

      // 2. Merge with defaults (checks against cleaned list)
      const defaults = Storage.INITIAL_USERS;
      defaults.forEach(defUser => {
          const defUsername = defUser.username.trim().toLowerCase();
          // Check if default user exists in cleaned list (case-insensitive)
          const exists = cleanedUsers.some(u => u.username.toLowerCase() === defUsername);
          if (!exists) {
              cleanedUsers.push(defUser);
          }
      });

      // 3. Deduplicate (Use Map to keep unique by username, prefer the one with more info/fetched status)
      const uniqueMap = new Map<string, UserAccount>();
      
      cleanedUsers.forEach(u => {
          const key = u.username.toLowerCase();
          if (uniqueMap.has(key)) {
              // If duplicates exist, merge them (prefer properties of the later one if valid)
              const existing = uniqueMap.get(key)!;
              uniqueMap.set(key, { ...existing, ...u });
          } else {
              uniqueMap.set(key, u);
          }
      });

      return Array.from(uniqueMap.values());
  };

  // --- SYNC DATA WITH GOOGLE SHEETS ON STARTUP ---
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
        // 1. Dữ liệu local đã được load ở useState, làm sạch trùng lặp ngay lập tức
        const safeLocalUsers = ensurePrivilegedUsers(Storage.getUsersList());
        
        // Nếu danh sách đã lọc khác với danh sách hiện tại (có trùng lặp), cập nhật ngay
        if (mounted && userAccounts.length !== safeLocalUsers.length) {
             setUserAccounts(safeLocalUsers);
             Storage.saveUsersList(safeLocalUsers); // Lưu lại bản sạch vào storage
        }

        // 2. Nếu không có API URL, dừng sync background
        if (!Storage.getApiUrl()) return;

        // 3. Bắt đầu Sync Background (Không set isLoading để tránh chặn UI)
        if (mounted) {
            setSyncStatus('syncing');
        }

        try {
            console.log("Background Syncing...");
            
            // Chạy song song các request
            const [
                fetchedStudents, 
                fetchedAttendance,
                fetchedUsers,
                fetchedConfig,
                fetchedNotifs,
                fetchedReviews
            ] = await Promise.all([
                api.getStudents().catch(e => { console.warn("Fetch Students Failed", e); return []; }),
                api.getAttendance().catch(e => { console.warn("Fetch Attendance Failed", e); return []; }),
                api.getUsers().catch(e => { console.warn("Fetch Users Failed", e); return []; }),
                api.getClassInfo().catch(e => { console.warn("Fetch ClassInfo Failed", e); return null; }),
                api.getNotifications().catch(e => { console.warn("Fetch Notifications Failed", e); return []; }),
                api.getReviews().catch(e => { console.warn("Fetch Reviews Failed", e); return []; })
            ]);

            if (mounted) {
                // UPDATE STATE ONLY IF DATA CHANGED (Simple check)
                
                if (fetchedStudents.length > 0) {
                    setStudents(fetchedStudents);
                    Storage.saveStudents(fetchedStudents);
                }
                
                if (fetchedAttendance.length > 0) {
                    setAttendanceHistory(fetchedAttendance);
                    Storage.saveAttendanceHistory(fetchedAttendance);
                }

                // Merge Users logic (FIXED DUPLICATE ISSUE)
                const currentLocalUsers = Storage.getUsersList().length > 0 ? Storage.getUsersList() : Storage.INITIAL_USERS;
                // Keep existing admins from local first
                const localPrivilegedUsers = currentLocalUsers.filter(u => u.role !== Role.PARENT); 
                
                const mergedUsers = [...localPrivilegedUsers];
                
                if (fetchedUsers.length > 0) {
                    fetchedUsers.forEach((apiUser: UserAccount) => {
                        // FIX: Normalize username for comparison (trim + lowercase)
                        const apiUsername = (apiUser.username || '').toString().trim().toLowerCase();
                        
                        const index = mergedUsers.findIndex(u => 
                            (u.username || '').toString().trim().toLowerCase() === apiUsername
                        );
                        
                        if (index >= 0) {
                            // Found duplicate: Merge API data into existing (API is source of truth)
                            mergedUsers[index] = { ...mergedUsers[index], ...apiUser };
                        } else {
                            // New user
                            mergedUsers.push(apiUser);
                        }
                    });
                }
                const finalUsers = ensurePrivilegedUsers(mergedUsers); // Chạy khử trùng lặp lần cuối
                setUserAccounts(finalUsers);
                Storage.saveUsersList(finalUsers);

                if (fetchedConfig && fetchedConfig.className) {
                    const mergedConfig = { ...classInfo, ...fetchedConfig };
                    setClassInfo(mergedConfig);
                    Storage.saveClassInfo(mergedConfig);
                }

                if (fetchedNotifs.length > 0) {
                    setNotifications(fetchedNotifs);
                    Storage.saveNotifications(fetchedNotifs);
                }

                if (fetchedReviews.length > 0) {
                    setReviews(fetchedReviews);
                    Storage.saveReviews(fetchedReviews);
                }

                setSyncStatus('success');
                setLastSyncTime(new Date());
                console.log("Sync completed.");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            if (mounted) setSyncStatus('error');
        }
    };

    fetchData();

    return () => { mounted = false; };
  }, [apiUrl]);

  // --- ACTIONS (Cập nhật Local + Gọi API nền) ---

  const login = (username: string, password: string): { success: boolean; message?: string } => {
      // Normalize input
      const cleanUsername = username.trim().toLowerCase();
      
      let foundUser = userAccounts.find(u => (u.username || '').trim().toLowerCase() === cleanUsername && u.password === password);
      
      // Fallback check against INITIAL_USERS if local storage is somehow empty/corrupt but code has defaults
      if (!foundUser) {
          foundUser = Storage.INITIAL_USERS.find(u => u.username.trim().toLowerCase() === cleanUsername && u.password === password);
          if (foundUser) {
              // Fix local storage if missing
              const exists = userAccounts.some(u => u.username.trim().toLowerCase() === cleanUsername);
              if (!exists) {
                  const fixedUsers = [...userAccounts, foundUser];
                  setUserAccounts(fixedUsers);
                  Storage.saveUsersList(fixedUsers);
              }
          }
      }

      if (foundUser) {
          if (foundUser.status === 'pending') {
              return { success: false, message: 'Tài khoản chưa được kích hoạt.' };
          }
          const sessionUser = { ...foundUser, status: foundUser.status || 'active' };
          setCurrentUser(sessionUser);
          Storage.saveCurrentUser(sessionUser);
          return { success: true };
      }
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
  };

  const logout = () => {
      setCurrentUser(null);
      Storage.saveCurrentUser(null);
  };

  const registerUser = (user: UserAccount) => {
      const newUser = { ...user, status: 'pending' as const };
      // Check duplicate before add
      const exists = userAccounts.some(u => u.username.trim().toLowerCase() === newUser.username.trim().toLowerCase());
      if (!exists) {
          const newAccounts = [...userAccounts, newUser];
          setUserAccounts(newAccounts);
          Storage.saveUsersList(newAccounts);
          api.createUser(newUser).catch(err => console.error("Register sync error", err));
      }
  };

  const addUserAccount = (user: UserAccount) => {
      const newUser = { ...user, status: user.status || 'active' };
      // Check duplicate before add (strict case insensitive)
      const exists = userAccounts.some(u => u.username.trim().toLowerCase() === newUser.username.trim().toLowerCase());
      if (!exists) {
          const newAccounts = [...userAccounts, newUser];
          setUserAccounts(newAccounts);
          Storage.saveUsersList(newAccounts);
          api.createUser(newUser);
      }
  };

  const updateUserAccount = (updatedUser: UserAccount) => {
      const newAccounts = userAccounts.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUserAccounts(newAccounts);
      Storage.saveUsersList(newAccounts);
      api.updateUser(updatedUser);

      if (currentUser && currentUser.id === updatedUser.id) {
          const { password, ...sessionUser } = updatedUser;
          setCurrentUser(sessionUser as UserAccount);
          Storage.saveCurrentUser(sessionUser as UserAccount);
      }
  };

  const deleteUserAccount = (id: string) => {
      const newAccounts = userAccounts.filter(u => u.id !== id);
      setUserAccounts(newAccounts);
      Storage.saveUsersList(newAccounts);
      api.deleteUser(id);
  };

  const showToast = (type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), type, message }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateClassInfo = (info: ClassInfo) => {
    setClassInfo(info);
    Storage.saveClassInfo(info);
  };

  const addStudent = (student: Student) => {
    const newStudents = [...students, student];
    setStudents(newStudents);
    Storage.saveStudents(newStudents);
    api.createStudent(student);
  };

  const addStudents = (newStudentsList: Student[]) => {
    const newStudents = [...students, ...newStudentsList];
    setStudents(newStudents);
    Storage.saveStudents(newStudents);
    const processBatch = async () => {
        const chunkSize = 3;
        for (let i = 0; i < newStudentsList.length; i += chunkSize) {
            const chunk = newStudentsList.slice(i, i + chunkSize);
            await Promise.all(chunk.map(s => api.createStudent(s).catch(e => console.error(e))));
            await new Promise(r => setTimeout(r, 200));
        }
    };
    processBatch();
  };

  const updateStudent = (updatedStudent: Student) => {
    const newStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(newStudents);
    Storage.saveStudents(newStudents);
    api.updateStudent(updatedStudent);
  };

  const updateStudents = async (updatedStudentsList: Student[]) => {
      const updateMap = new Map(updatedStudentsList.map(s => [s.id, s]));
      const newStudents = students.map(s => updateMap.get(s.id) || s);
      setStudents(newStudents);
      Storage.saveStudents(newStudents);
      
      const chunkSize = 4;
      try {
          for (let i = 0; i < updatedStudentsList.length; i += chunkSize) {
              const chunk = updatedStudentsList.slice(i, i + chunkSize);
              await Promise.all(
                  chunk.map(s => api.updateStudent(s).catch(err => console.error(`Sync failed for ${s.fullName}`, err)))
              );
              await new Promise(resolve => setTimeout(resolve, 300));
          }
      } catch (error) {
          console.error("Bulk update error:", error);
      }
  };

  const deleteStudent = (id: string) => {
    const newStudents = students.filter(s => s.id !== id);
    setStudents(newStudents);
    Storage.saveStudents(newStudents);
    api.deleteStudent(id);
  };

  const clearAllStudents = () => {
      const ids = students.map(s => s.id);
      setStudents([]);
      Storage.saveStudents([]);
      const deleteBatch = async () => {
          for (const id of ids) {
              await api.deleteStudent(id).catch(err => console.error("API delete failed for", id, err));
          }
      };
      deleteBatch();
  };

  const saveDailyAttendance = (record: DailyAttendance) => {
    const newHistory = [...attendanceHistory];
    const index = newHistory.findIndex(r => r.date === record.date);
    if (index >= 0) newHistory[index] = record;
    else newHistory.push(record);
    
    setAttendanceHistory(newHistory);
    Storage.saveAttendance(record);
    
    api.createAttendanceRecord(record.records.map(r => ({
        date: record.date,
        studentId: r.studentId,
        status: r.status,
        note: r.note || ''
    })));
  };

  const getAttendanceRecord = (date: string) => {
    return attendanceHistory.find(r => r.date === date);
  };

  const addNotification = (note: NotificationItem) => {
    const newNotifications = [note, ...notifications];
    setNotifications(newNotifications);
    Storage.saveNotifications(newNotifications);
    api.createNotification(note);
  };

  const deleteNotification = (id: string) => {
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
    Storage.saveNotifications(newNotifications);
    api.deleteNotification(id);
  };

  const updateDashboardNote = (note: string) => {
    setDashboardNote(note);
    Storage.saveDashboardNote(note);
  };

  const addReview = (review: Review) => {
    const existsIndex = reviews.findIndex(r => r.studentId === review.studentId && r.type === review.type && r.periodName === review.periodName);
    let newReviews = [...reviews];
    if (existsIndex >= 0) newReviews[existsIndex] = review;
    else newReviews = [review, ...reviews];
    
    setReviews(newReviews);
    Storage.saveReviews(newReviews);
    api.createReview(review); 
  };

  const deleteReview = (id: string) => {
    const newReviews = reviews.filter(r => r.id !== id);
    setReviews(newReviews);
    Storage.saveReviews(newReviews);
    api.deleteReview(id);
  };

  const sendMessage = (msg: Message) => {
      // 1. Save Message
      const newMessages = [...messages, msg];
      setMessages(newMessages);
      Storage.saveMessages(newMessages);

      // 2. Create Notification for the Receiver
      const senderName = currentUser?.fullName || 'Người gửi';
      const notification: NotificationItem = {
          id: `notif_${msg.id}`,
          title: `Tin nhắn mới từ ${senderName}`,
          content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''), 
          date: new Date().toISOString(),
          type: 'info',
          category: 'message', 
          senderName: senderName
      };
      
      addNotification(notification);
  };

  const updateApiUrl = (url: string) => {
      setApiUrl(url);
      Storage.saveApiUrl(url);
  };

  const refreshData = () => {
      setSyncStatus('syncing');
      if (Storage.getApiUrl()) {
        window.location.reload(); 
      }
  };

  const value = {
    isLoading,
    syncStatus, lastSyncTime,
    currentUser, login, logout,
    userAccounts, addUserAccount, updateUserAccount, deleteUserAccount, registerUser,
    classInfo, updateClassInfo,
    students, addStudent, addStudents, updateStudent, updateStudents, deleteStudent, clearAllStudents,
    attendanceHistory, saveDailyAttendance, getAttendanceRecord,
    notifications, addNotification, deleteNotification,
    dashboardNote, updateDashboardNote,
    reviews, addReview, deleteReview,
    messages, sendMessage, // NEW
    apiUrl, updateApiUrl,
    toasts, showToast, removeToast,
    refreshData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
