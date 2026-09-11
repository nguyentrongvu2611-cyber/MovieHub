import { useState } from "react";
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
  api.defaults.baseURL || "https://moviehub-backend-ln1c.onrender.com"
).replace(/\/api\/v1\/?$/, "");

const parseVideoUrls = (rawVideoUrls) => {
  if (!rawVideoUrls) return { "480p": "", "720p": "", "1080p": "" };
  if (typeof rawVideoUrls === "object") {
    return {
      "480p": rawVideoUrls["480p"] || "",
      "720p": rawVideoUrls["720p"] || "",
      "1080p": rawVideoUrls["1080p"] || "",
    };
  }
  try {
    const parsed = JSON.parse(rawVideoUrls);
    return {
      "480p": parsed["480p"] || "",
      "720p": parsed["720p"] || "",
      "1080p": parsed["1080p"] || "",
    };
  } catch (e) {
    console.error("Lỗi xử lý:", e);
    return { "480p": "", "720p": "", "1080p": "" };
  }
};

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

  const [formData, setFormData] = useState(() =>
    getInitialFormData(editingMovie, categoryOptions),
  );
  const [videoUrls, setVideoUrls] = useState(() =>
    parseVideoUrls(editingMovie?.video_urls),
  );
  const [posterInputMode, setPosterInputMode] = useState("upload");
  const [videoInputMode, setVideoInputMode] = useState("upload");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingVideoQuality, setUploadingVideoQuality] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVideoUrlChange = (quality, value) => {
    setVideoUrls((prev) => ({
      ...prev,
      [quality]: value,
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl =
        response.data?.url ||
        response.data?.poster_url ||
        response.data?.file_path;

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

  const handleUploadSingleVideo = async (event, quality) => {
    const file = event.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setUploadingVideoQuality(quality);
      const response = await api.post("/upload/video", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl =
        response.data?.url ||
        response.data?.video_url ||
        response.data?.file_path;

      if (uploadedUrl) {
        setVideoUrls((prev) => ({
          ...prev,
          [quality]: uploadedUrl,
        }));
        toast.success(`🎬 Upload video bản ${quality} thành công!`);
      }
    } catch (error) {
      console.error(`Lỗi upload video ${quality}:`, error);
      toast.error(
        error?.response?.data?.detail || `Upload video ${quality} thất bại!`,
      );
    } finally {
      setUploadingVideoQuality(null);
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

    const hasAtLeastOneVideo = Object.values(videoUrls).some(
      (url) => url && url.trim() !== "",
    );
    if (!hasAtLeastOneVideo) {
      return toast.warning(
        "Vui lòng cung cấp ít nhất 1 video (480p, 720p hoặc 1080p)!",
      );
    }

    const defaultVideoUrl =
      videoUrls["1080p"] || videoUrls["720p"] || videoUrls["480p"] || "";

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      year: Number(formData.year),
      duration: Number(formData.duration),
      video_url: defaultVideoUrl,
      video_urls: videoUrls, // ✅ Sửa ở đây: Truyền thẳng Object
    };

    onSubmit(payload);
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http")
      ? url
      : `${BACKEND_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        style={{ zIndex: 999999 }}
      />

      <div className="movie-modal" onClick={(e) => e.stopPropagation()}>
        <div className="movie-modal-header">
          <div>
            <h2>{editingMovie ? "✏️ Chỉnh sửa phim" : "🎬 Thêm phim mới"}</h2>
            <p>Nhập đầy đủ thông tin phim và tải lên các bản video tương ứng</p>
          </div>
          <button className="movie-close-btn" type="button" onClick={onClose}>
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
              <label>Chất lượng hiển thị *</label>
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

          {/* Multi-Quality Video Upload Box */}
          <div className="form-group full upload-box-container">
            <div className="upload-header">
              <label>Video Phim (3 Chất Lượng) *</label>
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
                  🔗 Nhập Link Direct
                </button>
              </div>
            </div>

            <div
              className="quality-inputs-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "10px",
              }}
            >
              {["480p", "720p", "1080p"].map((q) => (
                <div
                  key={q}
                  className="quality-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      minWidth: "60px",
                      fontWeight: "bold",
                      color: "#f59e0b",
                    }}
                  >
                    {q}:
                  </span>

                  {videoInputMode === "upload" ? (
                    <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                      <input
                        type="file"
                        accept="video/mp4,video/mkv"
                        onChange={(e) => handleUploadSingleVideo(e, q)}
                        disabled={uploadingVideoQuality !== null}
                      />
                      {uploadingVideoQuality === q && (
                        <span style={{ color: "#eab308" }}>⏳ Đang tải...</span>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={videoUrls[q]}
                      onChange={(e) => handleVideoUrlChange(q, e.target.value)}
                      placeholder={`Nhập URL video ${q}...`}
                      style={{ flex: 1 }}
                    />
                  )}

                  {videoUrls[q] && (
                    <span style={{ color: "#10b981", fontSize: "0.85rem" }}>
                      ✅ Đã có
                    </span>
                  )}
                </div>
              ))}
            </div>
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
              disabled={uploadingPoster || uploadingVideoQuality !== null}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="save-movie-btn"
              disabled={uploadingPoster || uploadingVideoQuality !== null}
            >
              {editingMovie ? "💾 Lưu thay đổi" : "➕ Thêm phim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
