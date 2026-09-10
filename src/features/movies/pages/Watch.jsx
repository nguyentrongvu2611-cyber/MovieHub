import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

// Shared API Client Instance
import api from "../../../services/api";
import { getMovieById } from "../movieService";
import MovieComments from "../components/MovieComments";

import "./Watch.css";

function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState("");

  // Mặc định chất lượng là 480p
  const [selectedQuality, setSelectedQuality] = useState("480p");

  // Ref lưu thẻ video và thời gian xem dở
  const videoRef = useRef(null);
  const savedTimeRef = useRef(0);

  const hasRecorded = useRef(false);
  const sessionIdRef = useRef(null);

  const canDownload = Boolean(currentUser?.can_download);
  const userId = currentUser?.id || currentUser?._id;

  // Kiểm tra user có phải Premium/Admin không
  const isPremiumUser = Boolean(
    currentUser?.is_premium === true ||
    currentUser?.is_premium === "true" ||
    currentUser?.is_premium === 1 ||
    currentUser?.role === "admin",
  );

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMovieById(id);

        if (!data) {
          setError("Không tìm thấy thông tin phim!");
          return;
        }

        let isMoviePremium = false;
        if (data.is_free !== undefined && data.is_free !== null) {
          isMoviePremium =
            data.is_free === false ||
            data.is_free === "false" ||
            data.is_free === 0;
        } else if (data.is_premium !== undefined && data.is_premium !== null) {
          isMoviePremium =
            data.is_premium === true ||
            data.is_premium === "true" ||
            data.is_premium === 1;
        } else {
          isMoviePremium = data.access_type === "premium";
        }

        if (isMoviePremium && !isPremiumUser) {
          alert(
            "🔒 Đây là phim độc quyền Premium! Vui lòng nâng cấp tài khoản để thưởng thức.",
          );
          navigate("/movies");
          return;
        }

        setMovie(data);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết phim:", err);
        setError("Không thể kết nối đến máy chủ hoặc không tìm thấy phim.");
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id, navigate, currentUser, isPremiumUser]);

  // HỆ THỐNG HEARTBEAT
  useEffect(() => {
    if (!userId || !movie) return;

    if (!sessionIdRef.current) {
      sessionIdRef.current = Math.random().toString(36).substring(2, 15);
    }

    const sendPing = async () => {
      try {
        await api.post(`/streaming/ping/${userId}/${sessionIdRef.current}`);
        setStreamError("");
      } catch (err) {
        if (err.response?.status === 403) {
          setStreamError(
            err.response.data?.detail ||
              "⚠️ Bạn đã vượt quá số màn hình cho phép xem cùng lúc!",
          );
        }
      }
    };

    sendPing();
    const intervalId = setInterval(sendPing, 1500);

    return () => {
      clearInterval(intervalId);
      const leavePath = `/streaming/leave/${userId}/${sessionIdRef.current}`;
      const baseUrl =
        api.defaults.baseURL ||
        "https://moviehub-backend-ln1c.onrender.com/api/v1";
      const fullLeaveUrl = baseUrl.endsWith("/")
        ? `${baseUrl.slice(0, -1)}${leavePath}`
        : `${baseUrl}${leavePath}`;

      if (navigator.sendBeacon) {
        navigator.sendBeacon(fullLeaveUrl);
      } else {
        api.delete(leavePath).catch(() => {});
      }
    };
  }, [movie, userId]);

  // Ghi nhận lịch sử xem
  useEffect(() => {
    const recordMovieView = async () => {
      if (!userId || !id || hasRecorded.current || !movie) return;

      try {
        hasRecorded.current = true;
        await api.post(`/history/watch/${userId}/${id}`);
      } catch (err) {
        console.error("Lỗi khi ghi nhận lịch sử xem phim:", err);
      }
    };

    recordMovieView();
  }, [id, movie, userId]);

  // FIX 1: Ghép URL chính xác cho cả domain absolute và path relative
  const getFullVideoUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
      return rawUrl;

    const apiBase =
      api.defaults.baseURL || "https://moviehub-backend-ln1c.onrender.com";
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    } catch {
      return `https://moviehub-backend-ln1c.onrender.com${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    }
  };

  // Xác định đường dẫn video theo chất lượng
  const getCurrentVideoSource = () => {
    if (!movie) return null;

    if (
      movie.video_urls &&
      typeof movie.video_urls === "object" &&
      movie.video_urls[selectedQuality]
    ) {
      return getFullVideoUrl(movie.video_urls[selectedQuality]);
    }

    return getFullVideoUrl(movie.video_url);
  };

  // FIX 2: Lưu lại thời gian phát hiện tại trước khi chuyển chất lượng
  const handleQualityChange = (quality) => {
    if ((quality === "720p" || quality === "1080p") && !isPremiumUser) {
      alert(
        "🔒 Chất lượng " +
          quality +
          " chỉ dành cho tài khoản PREMIUM! Vui lòng nâng cấp gói để trải nghiệm sắc nét hơn.",
      );
      return;
    }

    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime;
    }
    setSelectedQuality(quality);
  };

  // FIX 3: Khôi phục thời gian xem sau khi video mới load xong
  const handleLoadedMetadata = () => {
    if (videoRef.current && savedTimeRef.current > 0) {
      videoRef.current.currentTime = savedTimeRef.current;
      videoRef.current.play().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div
        className="watch-page"
        style={{
          padding: "120px 4%",
          color: "#fff",
          textAlign: "center",
          minHeight: "100vh",
        }}
      >
        <h2>⏳ Đang kiểm tra quyền truy cập...</h2>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div
        className="watch-page"
        style={{
          padding: "120px 4%",
          color: "#fff",
          textAlign: "center",
          minHeight: "100vh",
        }}
      >
        <h2>⚠️ {error || "Không tìm thấy nội dung phim"}</h2>
        <Link
          to="/movies"
          style={{
            color: "#3b82f6",
            textDecoration: "underline",
            marginTop: "16px",
            display: "inline-block",
          }}
        >
          ← Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  const activeVideoUrl = getCurrentVideoSource();

  return (
    <div
      className="watch-page"
      style={{
        padding: "100px 4% 50px",
        backgroundColor: "#141414",
        color: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <div
        className="watch-container"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            {movie.title}
          </h1>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              fontSize: "14px",
              color: "#9ca3af",
            }}
          >
            <span>Năm phát hành {movie.year || "N/A"}</span>
            <span>•</span>
            <span>Thời lượng {movie.duration || 120} phút</span>
            <span>•</span>
            <span
              style={{
                backgroundColor:
                  movie.is_free === false ? "#cfc840" : "#10b981",
                color: "#000",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {movie.is_free === false ? "PREMIUM" : "FREE"}
            </span>
          </div>
        </div>

        {streamError ? (
          <div
            style={{
              padding: "80px 20px",
              backgroundColor: "#3f1212",
              border: "1px solid #ef4444",
              borderRadius: "12px",
              textAlign: "center",
              margin: "20px 0",
            }}
          >
            <h3
              style={{
                fontSize: "22px",
                color: "#f87171",
                marginBottom: "12px",
              }}
            >
              🚫 Không thể phát Video
            </h3>
            <p style={{ color: "#fca5a5", fontSize: "16px" }}>{streamError}</p>
          </div>
        ) : activeVideoUrl ? (
          <div
            style={{
              width: "100%",
              backgroundColor: "#000",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            {/* TRÌNH PHÁT VIDEO */}
            <video
              ref={videoRef}
              className="movie-video"
              controls
              autoPlay
              src={activeVideoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              controlsList={canDownload ? "" : "nodownload"}
              onContextMenu={(e) => !canDownload && e.preventDefault()}
              style={{ width: "100%", maxHeight: "70vh", display: "block" }}
            >
              Trình duyệt của bạn không hỗ trợ phát video này.
            </video>

            {/* THANH BẤM CHỌN CHẤT LƯỢNG */}
            <div
              style={{
                padding: "12px 20px",
                backgroundColor: "#1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                borderTop: "1px solid #374151",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#d1d5db",
                }}
              >
                ⚙️ Chất lượng video:
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                {["480p", "720p", "1080p"].map((q) => {
                  const isLocked =
                    (q === "720p" || q === "1080p") && !isPremiumUser;
                  const isActive = selectedQuality === q;

                  return (
                    <button
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: "none",
                        transition: "all 0.2s ease",
                        backgroundColor: isActive
                          ? "#3b82f6"
                          : isLocked
                            ? "#374151"
                            : "#4b5563",
                        color: isLocked ? "#9ca3af" : "#ffffff",
                        opacity: isLocked ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {q} {isLocked && "🔒"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "60px 20px",
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              textAlign: "center",
              margin: "20px 0",
            }}
          >
            <h3 style={{ fontSize: "20px", color: "#f3f4f6" }}>
              🎬 Chưa có file Video
            </h3>
          </div>
        )}

        <div
          className="watch-info"
          style={{
            marginTop: "30px",
            backgroundColor: "#1f2937",
            padding: "24px",
            borderRadius: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#f3f4f6",
            }}
          >
            Nội dung phim
          </h3>
          <p style={{ lineHeight: "1.6", color: "#d1d5db", fontSize: "15px" }}>
            {movie.description || "Chưa có mô tả cho bộ phim này."}
          </p>
        </div>

        <MovieComments movieId={movie.id} />
      </div>
    </div>
  );
}

export default Watch;
