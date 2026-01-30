import * as XLSX from 'xlsx';
import { Student, DailyAttendance, Review, ClassInfo } from '../types';

// Hàm tiện ích để định dạng chiều rộng cột
const fitToColumn = (data: any[]) => {
  const keys = Object.keys(data[0] || {});
  return keys.map(key => ({
    wch: Math.max(
      ...data.map(row => (row[key] ? row[key].toString().length : 0)),
      key.length
    ) + 5
  }));
};

const getStatusText = (status?: string) => {
    if (status === 'dropped_out') return 'Nghỉ học';
    if (status === 'transfer') return 'Chuyển trường';
    return 'Đang học';
};

export const exportToExcel = (
  students: Student[], 
  attendanceHistory: DailyAttendance[], 
  reviews: Review[],
  classInfo: ClassInfo
) => {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: DANH SÁCH HỌC SINH ---
  const studentData = students.map((s, index) => ({
    'STT': index + 1,
    'Mã HS': s.id,
    'Họ và tên đệm': s.lastName, // SPLIT
    'Tên': s.firstName,          // SPLIT
    'Giới tính': s.gender,
    'Ngày sinh': new Date(s.dateOfBirth).toLocaleDateString('vi-VN'),
    'Nơi sinh': s.placeOfBirth || '', // NEW FIELD
    'Dân tộc': s.ethnicity || '',
    'Trạng thái': getStatusText(s.status),
    'CCCD/Mã ĐD': s.cccd || '',
    'Địa chỉ': s.address,
    // Father
    'Họ tên Cha': s.fatherName || '',
    'Năm sinh Cha': s.fatherYearOfBirth || '', // NEW FIELD
    'SĐT Cha': s.fatherPhone || '',
    'Nghề nghiệp Cha': s.fatherJob || '',
    // Mother
    'Họ tên Mẹ': s.motherName || '',
    'Năm sinh Mẹ': s.motherYearOfBirth || '', // NEW FIELD
    'SĐT Mẹ': s.motherPhone || '',
    'Nghề nghiệp Mẹ': s.motherJob || '',
    // Guardian
    'Họ tên Giám hộ': s.guardianName || '',
    'SĐT Giám hộ': s.guardianPhone || '',
    'Nghề nghiệp Giám hộ': s.guardianJob || '',
    // Notes
    'Ghi chú': s.notes || ''
  }));

  const wsStudents = XLSX.utils.json_to_sheet(studentData);
  wsStudents['!cols'] = fitToColumn(studentData);
  XLSX.utils.book_append_sheet(wb, wsStudents, "Danh Sách Lớp");

  // --- SHEET 2: BẢNG ĐIỂM DANH (MATRIX) ---
  // Tạo header hàng ngang là các ngày
  const sortedDates = [...attendanceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Chỉ xuất học sinh Đang học trong danh sách điểm danh (Loại cả Nghỉ học và Chuyển trường)
  const activeStudents = students.filter(s => s.status !== 'dropped_out' && s.status !== 'transfer');

  const attendanceData = activeStudents.map((s, index) => {
    const row: any = {
      'STT': index + 1,
      'Họ và tên đệm': s.lastName,
      'Tên': s.firstName
    };
    
    let totalAbsent = 0;

    sortedDates.forEach(day => {
       const record = day.records.find(r => r.studentId === s.id);
       const dateStr = new Date(day.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
       
       if (record) {
           if (record.status === 'present') row[dateStr] = 'x';
           else if (record.status === 'excused') { row[dateStr] = 'P'; totalAbsent++; }
           else if (record.status === 'unexcused') { row[dateStr] = 'K'; totalAbsent++; }
           else row[dateStr] = '';
       } else {
           row[dateStr] = ''; // Chưa điểm danh
       }
    });

    row['Tổng nghỉ'] = totalAbsent;
    return row;
  });

  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  wsAttendance['!cols'] = [{wch: 5}, {wch: 25}, {wch: 10}, ...sortedDates.map(() => ({wch: 5})), {wch: 10}];
  XLSX.utils.book_append_sheet(wb, wsAttendance, "Điểm Danh");

  // --- SHEET 3: NHẬN XÉT ---
  const reviewData = reviews.map((r, index) => {
      const student = students.find(s => s.id === r.studentId);
      return {
          'STT': index + 1,
          'Học sinh': student?.fullName || r.studentId,
          'Loại': r.type === 'WEEKLY' ? 'Tuần' : r.type === 'MONTHLY' ? 'Tháng' : 'Kỳ',
          'Thời gian': r.periodName,
          'Nội dung nhận xét': r.content,
          'Ngày tạo': new Date(r.date).toLocaleDateString('vi-VN')
      };
  });
  
  // Nếu chưa có review nào, tạo dòng mẫu
  if (reviewData.length === 0) {
      reviewData.push({
          'STT': 1, 'Học sinh': 'Mẫu', 'Loại': '', 'Thời gian': '', 'Nội dung nhận xét': 'Chưa có dữ liệu', 'Ngày tạo': ''
      });
  }

  const wsReviews = XLSX.utils.json_to_sheet(reviewData);
  wsReviews['!cols'] = [{wch: 5}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 50}, {wch: 15}];
  XLSX.utils.book_append_sheet(wb, wsReviews, "Nhận Xét");

  // --- SAVE FILE ---
  const fileName = `Bao_Cao_Lop_${classInfo.className}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};