import { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  MOVIE_TYPES as CONST_MOVIE_TYPES,
  CATEGORIES as CONST_CATEGORIES,
  COUNTRIES as CONST_COUNTRIES,
  TOPICS as CONST_TOPICS,
} from "../../../utils/constants";

const DEFAULT_MOVIE_TYPES = CONST_MOVIE_TYPES || [
  { value: "single", label: "Phim Lẻ" },
  { value: "series", label: "Phim Bộ" },
];

const DEFAULT_CATEGORIES = CONST_CATEGORIES || [
  { value: "1", label: "Hành Động" },
  { value: "2", label: "Tình Cảm" },
];

const DEFAULT_COUNTRIES = CONST_COUNTRIES || [
  { value: "vn", label: "Việt Nam" },
  { value: "kr", label: "Hàn Quốc" },
];

const DEFAULT_TOPICS = CONST_TOPICS || [
  { value: "feature", label: "Phim Chiếu Rạp" },
];

const BACKEND_BASE_URL = (
  api.defaults.baseURL || "http://127.0.0.1:8000"
).replace(/\/api\/v1\/?$/, "");

const getInitialFormData = (movie, categoryOptions = []) => {
  if (movie) {
    return {
      title: movie.title || "",
      director: movie.director || "",
      description: movie.description || "",
      movie_type: movie.movie_type || DEFAULT_MOVIE_TYPES[0].value,
      category_id:
        movie.category_id ||
        movie.category?.id ||
        categoryOptions[0]?.value ||
        "",
      country: movie.country || DEFAULT_COUNTRIES[0].value,
      section_type: movie.section_type || DEFAULT_TOPICS[0].value,
      year: movie.year || movie.release_year || new Date().getFullYear(),
      duration: movie.duration || 120,
      quality: movie.quality || "1080p",
      poster_url: movie.poster_url || "",
      video_url: movie.video_url || "",
      video_urls: movie.video_urls || null,
      is_free: movie.is_free !== undefined ? Boolean(movie.is_free) : true,
    };
  }
  return {
    title: "",
    director: "",
    description: "",
    movie_type: DEFAULT_MOVIE_TYPES[0].value,
    category_id: categoryOptions[0]?.value || "",
    country: DEFAULT_COUNTRIES[0].value,
    section_type: DEFAULT_TOPICS[0].value,
    year: new Date().getFullYear(),
    duration: 120,
    quality: "1080p",
    poster_url: "",
    video_url: "",
    video_urls: null,
    is_free: true,
  };
};

export default function MovieModalForm({
  isOpen,
  onClose,
  onSubmit,
  editingMovie,
  categories = [],
}) {
  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => ({ value: String(c.id), label: c.name }))
      : DEFAULT_CATEGORIES;

  const [prevMovie, setPrevMovie] = useState(editingMovie);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const [formData, setFormData] = useState(() =>
    getInitialFormData(editingMovie, categoryOptions),
  );
  const [posterInputMode, setPosterInputMode] = useState(() =>
    editingMovie?.poster_url?.startsWith("http") ? "url" : "upload",
  );
  const [videoInputMode, setVideoInputMode] = useState(() =>
    editingMovie?.video_url?.startsWith("http") ? "url" : "upload",
  );

  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [convertLogs, setConvertLogs] = useState([]);

  const logConsoleRef = useRef(null);
  const cleanSseMessage = (rawMsg) => {
    if (!rawMsg) return "";
    let text = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);

    return text
      .replace(/^\[SSE LOG\]:\s*/gi, "")
      .replace(/^(?:-->\s*)?\[Upload Route\]\s*/gi, "")
      .replace(/^[🚀🎉✅]\s*/gu, "") 
      .trim();
  };
  if (editingMovie !== prevMovie || isOpen !== prevIsOpen) {
    setPrevMovie(editingMovie);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(getInitialFormData(editingMovie, categoryOptions));
      setPosterInputMode(
        editingMovie?.poster_url?.startsWith("http") ? "url" : "upload",
      );
      setVideoInputMode(
        editingMovie?.video_url?.startsWith("http") ? "url" : "upload",
      );
      setConvertLogs([]);
      setUploadProgress(0);
    }
  }

  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [convertLogs]);

  // Lắng nghe tiến trình HLS từ Server via SSE (Server-Sent Events)
 useEffect(() => {
  if (!uploadingVideo) return;

  // Mở kết nối EventSource SSE
  const eventSource = new EventSource(
    `${BACKEND_BASE_URL}/api/v1/upload/stream-progress`
  );

  eventSource.onmessage = (event) => {
    let rawText = event.data;
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.message) rawText = parsed.message;
    } catch {
      // Giữ nguyên rawText nếu không phải JSON
    }

    const cleanMsg = cleanSseMessage(rawText);
    if (!cleanMsg) return;

    // 1. Cập nhật log vào Terminal nhỏ trong Modal
    setConvertLogs((prev) => [...prev, cleanMsg]);

    // 2. Kiểm tra trạng thái hoàn thành
    const isFinished = cleanMsg.toLowerCase().includes("hoàn tất xử lý tất cả");

    if (isFinished) {
      toast.update("sse-convert-toast", {
        render: (
          <div style={{ padding: "2px 0" }}>
            <div style={{ fontWeight: "bold", color: "#4adb83", fontSize: "13px" }}>
              🎉 Hoàn tất xử lý tất cả độ phân giải!
            </div>
          </div>
        ),
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
      eventSource.close();
    } else {
      // 3. Cập nhật realtime từng độ phân giải (480p, 720p, 1080p...)
      toast.update("sse-convert-toast", {
        render: (
          <div style={{ padding: "2px 0", maxWidth: "260px" }}>
            <div style={{ fontWeight: "600", fontSize: "13px", color: "#61afef", marginBottom: "3px" }}>
              ⚙️ Tiến trình Convert HLS
            </div>
            <div style={{ fontSize: "12px", color: "#abb2bf", whiteSpace: "normal", wordBreak: "break-word" }}>
              👉 {cleanMsg}
            </div>
          </div>
        ),
        type: "info",
        isLoading: true,
      });
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}, [uploadingVideo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUploadPoster = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setUploadingPoster(true);
      const response = await api.post("/upload/poster", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        response.data?.url ||
        response.data?.poster_url ||
        response.data?.file_path ||
        response.data;

      if (typeof uploadedUrl === "string") {
        setFormData((prev) => ({ ...prev, poster_url: uploadedUrl }));
        toast.success("🖼️ Upload Poster thành công!");
      }
    } catch (error) {
      console.error("Lỗi upload poster:", error);
      toast.error(error?.response?.data?.detail || "Upload poster thất bại!");
    } finally {
      setUploadingPoster(false);
      event.target.value = "";
    }
  };

const handleUploadVideo = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  try {
    setUploadingVideo(true);
    setUploadProgress(0);
    setConvertLogs([]);

    // 1. Tạo Toast hiển thị ban đầu
    toast.loading(
      <div style={{ padding: "2px 0" }}>
        <div style={{ fontWeight: "600", fontSize: "13px", color: "#61afef" }}>
          🚀 Đang kết nối tiến trình xử lý...
        </div>
      </div>,
      { toastId: "sse-convert-toast" }
    );

    // 2. Kích hoạt kết nối SSE NGAY LẬP TỨC trước khi POST file
    const eventSource = new EventSource(
      `${BACKEND_BASE_URL}/api/v1/upload/stream-progress`
    );

    eventSource.onmessage = (e) => {
      let rawText = e.data;
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.message) rawText = parsed.message;
      } catch {
        // Giữ nguyên rawText
      }

      const cleanMsg = cleanSseMessage(rawText);
      if (!cleanMsg) return;

      // Cập nhật log console trong Modal
      setConvertLogs((prev) => [...prev, cleanMsg]);

      // Cập nhật Toast đồng bộ 100% với Backend
      const isFinished = cleanMsg.toLowerCase().includes("hoàn tất xử lý tất cả");

      if (isFinished) {
        toast.update("sse-convert-toast", {
          render: (
            <div style={{ padding: "2px 0" }}>
              <div style={{ fontWeight: "bold", color: "#4adb83", fontSize: "13px" }}>
                🎉 Hoàn tất xử lý tất cả độ phân giải!
              </div>
            </div>
          ),
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
        eventSource.close(); // Đóng SSE khi xong hẳn
      } else {
        toast.update("sse-convert-toast", {
          render: (
            <div style={{ padding: "2px 0", maxWidth: "260px" }}>
              <div style={{ fontWeight: "600", fontSize: "13px", color: "#61afef", marginBottom: "3px" }}>
                ⚙️ Tiến trình HLS
              </div>
              <div style={{ fontSize: "12px", color: "#abb2bf", whiteSpace: "normal", wordBreak: "break-word" }}>
                👉 {cleanMsg}
              </div>
            </div>
          ),
          type: "info",
          isLoading: true,
        });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    // 3. Tiến hành POST upload file lên server (SSE đã sẵn sàng hứng log)
    const response = await api.post("/upload/video", uploadFormData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      },
    });

    const uploadedUrl = response.data?.url || response.data?.video_url || response.data?.file_path;
    const uploadedVideoUrls = response.data?.video_urls || null;

    if (uploadedUrl) {
      setFormData((prev) => ({
        ...prev,
        video_url: uploadedUrl,
        video_urls: uploadedVideoUrls,
      }));
    }
  } catch (error) {
    console.error("Lỗi upload video:", error);
    toast.update("sse-convert-toast", {
      render: `❌ Lỗi: ${error?.response?.data?.detail || "Upload video thất bại!"}`,
      type: "error",
      isLoading: false,
      autoClose: 4000,
      closeButton: true,
    });
  } finally {
    setUploadingVideo(false);
    event.target.value = "";
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.warning("Vui lòng nhập tên phim!");
    if (!formData.description.trim())
      return toast.warning("Vui lòng nhập mô tả!");
    if (!formData.poster_url.trim())
      return toast.warning("Vui lòng chọn Poster!");
    if (!formData.video_url.trim())
      return toast.warning("Vui lòng chọn Video!");

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      year: Number(formData.year),
      duration: Number(formData.duration),
    };

    onSubmit(payload);
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http")
      ? url
      : `${BACKEND_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  if (!isOpen) return null;

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      {/* Container hiển thị Toast thông báo ở góc trên bên phải ngoài Modal */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme="dark"
        style={{ zIndex: 999999 }}
      />

      <div className="movie-modal" onClick={(e) => e.stopPropagation()}>
        <div className="movie-modal-header">
          <div>
            <h2>{editingMovie ? "✏️ Chỉnh sửa phim" : "🎬 Thêm phim mới"}</h2>
            <p>Nhập đầy đủ thông tin phim và phân loại chính xác</p>
          </div>
          <button className="movie-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="movie-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Tên phim *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tên phim..."
                required
              />
            </div>
            <div className="form-group">
              <label>Đạo diễn / Tác giả</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Nhập tên đạo diễn..."
              />
            </div>
          </div>

          <div className="form-group full">
            <label>Mô tả *</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả nội dung phim..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loại Phim *</label>
              <select
                name="movie_type"
                value={formData.movie_type}
                onChange={handleChange}
              >
                {DEFAULT_MOVIE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Thể Loại *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Chọn thể loại</option>
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quốc Gia *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                {DEFAULT_COUNTRIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Chủ Đề Phim *</label>
              <select
                name="section_type"
                value={formData.section_type}
                onChange={handleChange}
              >
                {DEFAULT_TOPICS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Năm phát hành *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Thời lượng (phút) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Chất lượng *</label>
              <select
                name="quality"
                value={formData.quality}
                onChange={handleChange}
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
          </div>

          {/* Poster Upload Box */}
          <div className="form-group full upload-box-container">
            <div className="upload-header">
              <label>Poster Phim *</label>
              <div className="upload-mode-toggle">
                <button
                  type="button"
                  className={posterInputMode === "upload" ? "active" : ""}
                  onClick={() => setPosterInputMode("upload")}
                >
                  📁 Upload File
                </button>
                <button
                  type="button"
                  className={posterInputMode === "url" ? "active" : ""}
                  onClick={() => setPosterInputMode("url")}
                >
                  🔗 Link URL
                </button>
              </div>
            </div>

            {posterInputMode === "upload" ? (
              <div className="upload-input-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  id="poster-upload"
                  onChange={handleUploadPoster}
                  disabled={uploadingPoster}
                />
                <label htmlFor="poster-upload" className="upload-btn-label">
                  {uploadingPoster
                    ? "⏳ Đang tải ảnh..."
                    : "🖼️ Chọn file ảnh từ máy..."}
                </label>
                {formData.poster_url && (
                  <div className="preview-container">
                    <img
                      src={getFullImageUrl(formData.poster_url)}
                      alt="Poster Preview"
                      className="preview-poster-img"
                    />
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
              />
            )}
          </div>

          {/* Video Upload Box */}
          <div className="form-group full upload-box-container">
            <div className="upload-header">
              <label>Video Phim *</label>
              <div className="upload-mode-toggle">
                <button
                  type="button"
                  className={videoInputMode === "upload" ? "active" : ""}
                  onClick={() => setVideoInputMode("upload")}
                >
                  📁 Upload File
                </button>
                <button
                  type="button"
                  className={videoInputMode === "url" ? "active" : ""}
                  onClick={() => setVideoInputMode("url")}
                >
                  🔗 Link URL
                </button>
              </div>
            </div>

            {videoInputMode === "upload" ? (
              <div className="upload-input-wrapper">
                <input
                  type="file"
                  accept="video/*"
                  id="video-upload"
                  onChange={handleUploadVideo}
                  disabled={uploadingVideo}
                />
                <label htmlFor="video-upload" className="upload-btn-label">
                  {uploadingVideo
                    ? `⏳ Đang tải & convert... ${uploadProgress}%`
                    : "🎥 Chọn file video từ máy..."}
                </label>

                {uploadingVideo && (
                  <div
                    className="progress-bar-container"
                    style={{ marginTop: "8px" }}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Khung Terminal Console log các bước convert */}
                {convertLogs.length > 0 && (
                  <div
                    ref={logConsoleRef}
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      backgroundColor: "#0d1117",
                      borderRadius: "6px",
                      border: "1px solid #30363d",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#3fb950",
                      maxHeight: "130px",
                      overflowY: "auto",
                    }}
                  >
                    {convertLogs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: "4px" }}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}

                {formData.video_url && (
                  <div className="preview-container video-preview">
                    <span>🎬 Video path: {formData.video_url}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://example.com/video.mp4"
              />
            )}
          </div>

          <div className="movie-access">
            <label className="access-checkbox">
              <input
                type="checkbox"
                name="is_free"
                checked={formData.is_free}
                onChange={handleChange}
              />
              <span>🎞️ Phim Miễn Phí (Free)</span>
            </label>
            <span className="access-hint">
              Bỏ chọn nếu đây là phim Premium.
            </span>
          </div>

          <div className="movie-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={uploadingPoster || uploadingVideo}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="save-movie-btn"
              disabled={uploadingPoster || uploadingVideo}
            >
              {editingMovie ? "💾 Lưu thay đổi" : "➕ Thêm phim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
