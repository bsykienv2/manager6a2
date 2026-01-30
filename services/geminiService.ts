import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Use process.env.API_KEY as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateStudentReport = async (studentName: string, conduct: string, notes: string) => {
  try {
    const ai = getClient();
    const prompt = `
      Bạn là một trợ lý giáo viên chuyên nghiệp, tận tâm và khéo léo tại Việt Nam.
      Hãy viết một đoạn nhận xét ngắn gọn (khoảng 3-4 câu) để gửi cho phụ huynh về học sinh sau:
      - Tên: ${studentName}
      - Hạnh kiểm: ${conduct}
      - Ghi chú thêm của giáo viên: ${notes}

      Yêu cầu:
      - Giọng văn trang trọng nhưng thân thiện, khích lệ.
      - Nhấn mạnh vào sự tiến bộ hoặc điểm mạnh.
      - Đưa ra lời khuyên nhẹ nhàng nếu cần cải thiện.
      - Tiếng Việt chuẩn mực.
    `;

    // Using gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });

    return response.text || "Không thể tạo nội dung lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với trợ lý AI. Vui lòng kiểm tra API Key.";
  }
};

export const generateMeetingInvitation = async (topic: string, date: string, time: string, location: string) => {
    try {
    const ai = getClient();
    const prompt = `
      Soạn thảo một mẫu tin nhắn Zalo hoặc SMS ngắn gọn để giáo viên chủ nhiệm gửi cho phụ huynh.
      Nội dung: Mời họp phụ huynh.
      - Chủ đề: ${topic}
      - Ngày: ${date}
      - Giờ: ${time}
      - Địa điểm: ${location}

      Yêu cầu: Lịch sự, ngắn gọn, đầy đủ thông tin, có lời kêu gọi xác nhận tham dự.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể tạo nội dung.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối AI.";
  }
}
