
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Student, ClassInfo, DailyAttendance, NotificationItem, User, Role, ToastMessage, ToastType, UserAccount, Review
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

  // 7. Cấu hình hệ thống (API URL)
  apiUrl: string;
  updateApiUrl: (url: string) => void;

  // 8. Toasts (Thông báo hệ thống)
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
  const [apiUrl, setApiUrl] = useState<string>(Storage.getApiUrl()); // New State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper: Đảm bảo người dùng quản trị luôn tồn tại
  const ensurePrivilegedUsers = (users: UserAccount[]): UserAccount[] => {
      const merged = [...users];
      const defaults = Storage.INITIAL_USERS;
      
      defaults.forEach(defUser => {
          const exists = merged.some(u => u.username === defUser.username);
          if (!exists) {
              merged.push(defUser);
          }
      });
      return merged;
  };

  // --- SYNC DATA WITH GOOGLE SHEETS ON STARTUP ---
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
        // 1. Dữ liệu local đã được load ở useState, đảm bảo admin tồn tại
        const safeLocalUsers = ensurePrivilegedUsers(Storage.getUsersList());
        if (mounted && userAccounts.length !== safeLocalUsers.length) {
             setUserAccounts(safeLocalUsers);
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

                // Merge Users logic
                const currentLocalUsers = Storage.getUsersList().length > 0 ? Storage.getUsersList() : Storage.INITIAL_USERS;
                const localPrivilegedUsers = currentLocalUsers.filter(u => u.role !== Role.PARENT); // Keep existing admins
                
                const mergedUsers = [...localPrivilegedUsers];
                if (fetchedUsers.length > 0) {
                    fetchedUsers.forEach((apiUser: UserAccount) => {
                        const index = mergedUsers.findIndex(u => u.username === apiUser.username);
                        if (index >= 0) {
                            mergedUsers[index] = { ...mergedUsers[index], ...apiUser };
                        } else {
                            mergedUsers.push(apiUser);
                        }
                    });
                }
                const finalUsers = ensurePrivilegedUsers(mergedUsers);
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
      let foundUser = userAccounts.find(u => u.username === username && u.password === password);
      
      if (!foundUser) {
          foundUser = Storage.INITIAL_USERS.find(u => u.username === username && u.password === password);
          if (foundUser) {
              const fixedUsers = [...userAccounts, foundUser];
              setUserAccounts(fixedUsers);
              Storage.saveUsersList(fixedUsers);
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
      setUserAccounts([...userAccounts, newUser]);
      Storage.saveUsersList([...userAccounts, newUser]);
      api.createUser(newUser).catch(err => console.error("Register sync error", err));
  };

  const addUserAccount = (user: UserAccount) => {
      const newUser = { ...user, status: user.status || 'active' };
      setUserAccounts([...userAccounts, newUser]);
      Storage.saveUsersList([...userAccounts, newUser]);
      api.createUser(newUser);
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
    // Config update is special, send specific keys to backend if needed or full object
    // Current api.ts structure for getClassInfo expects array, but update needs refactoring on backend
    // For now, we rely on local storage for immediate feel.
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
    
    // Backend supports creating full day attendance now via attendance.create
    // But our API maps it to create records. 
    // We send records array to API which calls attendance.create (GAS handles array)
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

  const updateApiUrl = (url: string) => {
      setApiUrl(url);
      Storage.saveApiUrl(url);
  };

  const refreshData = () => {
      setSyncStatus('syncing');
      if (Storage.getApiUrl()) {
        // Force re-fetch logic same as useEffect
        // ... (Simplified logic here calls reload to trigger useEffect)
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
