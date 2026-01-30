
export type Rank = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' | undefined;

interface GradingResult {
  rank: Rank;
}

export const SCORE_SUBJECTS = [
  "Toán", "Ngữ văn", "Ngoại ngữ", "GDCD", "Công nghệ", "Tin học", "KHTN", "LS-ĐL"
];

const ASSESSMENT_SUBJECTS = [
  "GDTC", "Nghệ thuật", "HĐTN", "GDĐP"
];

/**
 * Tính xếp loại theo Thông tư 22/2021/TT-BGDĐT
 */
export const calculatePerformance = (subjectScores: Record<string, any> | undefined): GradingResult => {
  if (!subjectScores) {
    return { rank: undefined };
  }

  // 1. Kiểm tra môn tính điểm (Score Subjects)
  let hasMissingScoreSubject = false;
  const scores: number[] = [];

  for (const sub of SCORE_SUBJECTS) {
    const rawVal = subjectScores[sub];
    // Handle cases where value might be string with comma
    let val = parseFloat(rawVal);
    if (typeof rawVal === 'string') {
        val = parseFloat(rawVal.replace(',', '.'));
    }

    // Nếu không phải số (NaN) hoặc rỗng -> Thiếu điểm
    if (isNaN(val)) {
      hasMissingScoreSubject = true;
      break; 
    }
    scores.push(val);
  }

  // 2. Kiểm tra môn nhận xét (Assessment Subjects)
  let assessmentFailCount = 0; 
  let hasMissingAssessmentSubject = false;

  for (const sub of ASSESSMENT_SUBJECTS) {
    const val = subjectScores[sub];
    // Theo TT22: Phải có đủ kết quả các môn đánh giá mới xếp loại
    if (!val || val.toString().trim() === '') {
        hasMissingAssessmentSubject = true;
        break;
    } else {
        const upperVal = val.toString().toUpperCase().trim();
        if (['CĐ', 'CHƯA ĐẠT', 'CD', '2', 'K', 'KHÔNG ĐẠT'].includes(upperVal)) {
            assessmentFailCount++;
        }
    }
  }

  // NẾU THIẾU BẤT KỲ MÔN NÀO -> KHÔNG XẾP LOẠI
  if (hasMissingScoreSubject || hasMissingAssessmentSubject) {
      return { rank: undefined };
  }
  
  const minScore = Math.min(...scores);
  const count8 = scores.filter(s => s >= 8.0).length;
  const count65 = scores.filter(s => s >= 6.5).length;
  const count5 = scores.filter(s => s >= 5.0).length;

  let rank: Rank = 'Chưa đạt';

  const isTot = assessmentFailCount === 0 && minScore >= 6.5 && count8 >= 6;
  const isKha = !isTot && assessmentFailCount === 0 && minScore >= 5.0 && count65 >= 6;
  const isDat = !isTot && !isKha && assessmentFailCount <= 1 && minScore >= 3.5 && count5 >= 6;

  if (isTot) rank = 'Tốt';
  else if (isKha) rank = 'Khá';
  else if (isDat) rank = 'Đạt';
  else rank = 'Chưa đạt';

  return { rank };
};

/**
 * Tính điểm tổng kết Cả năm theo Thông tư 22
 * ĐTBmcn = (ĐTBmhk1 + 2 * ĐTBmhk2) / 3
 * Môn nhận xét: Lấy kết quả HK2 là chủ yếu
 */
export const calculateYearlyScores = (hk1Scores: Record<string, any>, hk2Scores: Record<string, any>): Record<string, any> => {
    const cnScores: Record<string, any> = {};
    if (!hk1Scores || !hk2Scores) return cnScores;

    // 1. Môn tính điểm
    SCORE_SUBJECTS.forEach(sub => {
        let s1 = parseFloat(hk1Scores[sub]);
        let s2 = parseFloat(hk2Scores[sub]);
        
        // Handle comma decimal if present in raw string
        if (typeof hk1Scores[sub] === 'string') s1 = parseFloat(hk1Scores[sub].replace(',', '.'));
        if (typeof hk2Scores[sub] === 'string') s2 = parseFloat(hk2Scores[sub].replace(',', '.'));

        if (!isNaN(s1) && !isNaN(s2)) {
            // Công thức TT22: (HK1 + HK2*2) / 3
            const avg = (s1 + s2 * 2) / 3;
            // Làm tròn 1 chữ số thập phân
            cnScores[sub] = Math.round(avg * 10) / 10;
        }
    });

    // 2. Môn nhận xét
    // Đánh giá cả năm dựa trên kết quả các kỳ học, trọng số HK2 cao hơn.
    // Thông thường: Nếu HK2 Đạt -> Cả năm Đạt. Nếu HK2 CĐ -> Cả năm CĐ.
    ASSESSMENT_SUBJECTS.forEach(sub => {
        const raw = hk2Scores[sub];
        if (!raw) return; // Skip if missing

        const r2 = raw.toString().toUpperCase().trim();
        
        if (['Đ', 'DAT', 'ĐẠT', '1', 'D', 'P'].includes(r2)) {
            cnScores[sub] = 'Đ';
        } else if (['CĐ', 'CD', 'CHƯA ĐẠT', '2', 'C', 'K', 'KHÔNG ĐẠT'].includes(r2)) {
            cnScores[sub] = 'CĐ';
        } else {
            // Nếu giá trị không thuộc chuẩn nhưng có dữ liệu (ví dụ "Hoàn thành"), vẫn giữ lại để không bị coi là thiếu điểm
            cnScores[sub] = raw;
        }
    });

    return cnScores;
};

/**
 * Tính Hạnh kiểm Cả Năm dựa trên HK1 và HK2
 * Nguyên tắc chung: Hạnh kiểm Cả năm thiên về sự tiến bộ ở HK2.
 */
export const calculateYearlyConduct = (hk1Conduct: string | undefined, hk2Conduct: string | undefined): string => {
    if (!hk1Conduct || !hk2Conduct) return '';
    
    const c1 = hk1Conduct.trim();
    const c2 = hk2Conduct.trim();

    // Nếu HK2 Tốt -> Cả năm Tốt (ghi nhận sự cố gắng)
    if (c2 === 'Tốt') return 'Tốt';

    // Nếu HK2 Khá
    if (c2 === 'Khá') {
        // HK1 Tốt/Khá -> Khá
        if (c1 === 'Tốt' || c1 === 'Khá') return 'Khá';
        // HK1 Đạt/CĐ -> Có thể Khá hoặc Đạt (tùy hội đồng), ở đây tạm tính Khá để khuyến khích
        return 'Khá';
    }

    // Nếu HK2 Đạt
    if (c2 === 'Đạt') return 'Đạt';

    // Nếu HK2 Chưa đạt
    if (c2 === 'Chưa đạt') return 'Chưa đạt';

    return c2; // Fallback
};

/**
 * Tự động tính Danh hiệu dựa trên HL, RL và điểm số chi tiết
 * - HS Xuất sắc: HL Tốt, RL Tốt, có ít nhất 6 môn tính điểm >= 9.0
 * - HS Giỏi: HL Tốt, RL Tốt
 */
export const calculateAward = (academicRank: string, conductRank: string, scores: Record<string, any>): string => {
    const ac = academicRank?.trim();
    const co = conductRank?.trim();

    if (ac !== 'Tốt' || co !== 'Tốt') return 'Không có';

    // Đếm số lượng môn tính điểm >= 9.0
    let count9 = 0;
    SCORE_SUBJECTS.forEach(sub => {
        let val = parseFloat(scores[sub]);
        if (typeof scores[sub] === 'string') val = parseFloat(scores[sub].replace(',', '.'));
        
        if (!isNaN(val) && val >= 9.0) count9++;
    });

    // Điều kiện HS Xuất sắc: HL Tốt + RL Tốt + 6 môn >= 9.0
    if (count9 >= 6) return 'Học sinh Xuất sắc';
    
    // Điều kiện HS Giỏi: HL Tốt + RL Tốt
    return 'Học sinh Giỏi';
};
