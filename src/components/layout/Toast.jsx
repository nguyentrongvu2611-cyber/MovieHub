import { useState, useEffect } from "react";

// 1. Component Toast - Đã nâng z-index lên z-[9999] để đè lên mọi Modal
export const Toast = ({ message, isDone }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-slate-900/95 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-indigo-500/40 backdrop-blur-md transition-all duration-300 animate-slide-in min-w-[320px] max-w-[420px]">
      {!isDone ? (
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </div>
      ) : (
        <div className="w-5 h-5 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/40">
          ✓
        </div>
      )}
      <div className="flex flex-col overflow-hidden">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          Tiến trình Video
        </span>
        <span className="text-sm font-medium text-slate-100 truncate">
          {message}
        </span>
      </div>
    </div>
  );
};

// 2. TranscodeProgress - Chuẩn hóa Regex bắt đúng các log từ Backend FastAPI
export const TranscodeProgress = ({ onComplete, onToastChange }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Đang kết nối luồng xử lý...");

  useEffect(() => {
    const eventSource = new EventSource(
      "https://moviehub-backend-ln1c.onrender.com/stream-progress",
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const msg = data.message;

        if (msg) {
          // Làm sạch log để hiển thị Toast đẹp hơn (loại bỏ tiền tố [Upload Route])
          const cleanMsg = msg
            .replace(/^(-->|🚀|🎉|✅|\s*\[Upload Route\]\s*)*/g, "")
            .trim();
          setStatusText(cleanMsg || msg);

          // Bắn dữ liệu Toast ra ngoài
          if (onToastChange) {
            onToastChange({
              message: cleanMsg || msg,
              isDone:
                msg.includes("Hoàn tất xử lý") || msg.includes("thành công"),
            });
          }

          // Cập nhật % Tiến trình
          if (msg.includes("Bắt đầu tải")) setProgress(10);
          else if (msg.includes("Tải file gốc thành công")) setProgress(20);
          else if (msg.includes("Bắt đầu quá trình Convert")) setProgress(30);
          else if (msg.includes("convert 480p")) setProgress(40);
          else if (msg.includes("Hoàn tất 480p")) setProgress(55);
          else if (msg.includes("convert 720p")) setProgress(70);
          else if (msg.includes("Hoàn tất 720p")) setProgress(85);
          else if (msg.includes("convert 1080p")) setProgress(92);
          else if (
            msg.includes("Hoàn tất 1080p") ||
            msg.includes("Hoàn tất xử lý")
          ) {
            setProgress(100);
            eventSource.close();

            if (onComplete) {
              setTimeout(() => onComplete(), 1000);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi parse SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Lỗi kết nối SSE:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onComplete, onToastChange]);

  return (
    <div className="w-full bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 my-3 text-left shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-indigo-400 flex items-center gap-2 truncate max-w-[80%]">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
          <span className="truncate">{statusText}</span>
        </span>
        <span className="text-xs font-bold text-slate-300 font-mono ml-2">
          {progress}%
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
