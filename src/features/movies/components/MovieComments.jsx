import { useState, useEffect, useCallback } from "react";

// Import shared api instance (lùi 3 cấp: components -> movies -> features -> src)
import api from "../../../services/api";

import "./MovieComments.css";

// Lấy thông tin user hiện tại từ localStorage
const getCurrentUser = () => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
};

// Hàm định dạng thời gian tương đối
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Gần đây";

  let formattedStr = dateString;
  if (
    typeof dateString === "string" &&
    !dateString.endsWith("Z") &&
    !dateString.includes("+")
  ) {
    formattedStr = dateString + "Z";
  }

  const date = new Date(formattedStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (isNaN(seconds) || seconds < 60) return "Vừa xong";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;

  const years = Math.floor(days / 365);
  return `${years} năm trước`;
};

export default function MovieComments({ movieId }) {
  const user = getCurrentUser();

  // Đánh giá tổng quan
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Trạng thái người dùng hiện tại
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [hasCommented, setHasCommented] = useState(false);
  const [userCommentId, setUserCommentId] = useState(null);

  // Danh sách bình luận
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Trạng thái Chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // Tải danh sách Bình luận & Đánh giá từ Backend
  const fetchCommentsAndRatings = useCallback(async () => {
    if (!movieId) return;

    try {
      // SỬA: Bỏ /api ở đầu endpoint
      const response = await api.get(`/movies/${movieId}/comments/`);
      const data = response.data;

      if (data) {
        const loadedComments =
          data.comments || (Array.isArray(data) ? data : []);
        setComments(loadedComments);

        if (data.avg_rating !== undefined) setAvgRating(data.avg_rating);
        if (data.total_ratings !== undefined)
          setTotalRatings(data.total_ratings);

        // Kiểm tra xem người dùng hiện tại đã bình luận / đánh giá chưa
        if (user?.id) {
          const userComment = loadedComments.find(
            (c) => String(c.user_id) === String(user.id),
          );

          if (userComment) {
            setHasCommented(true);
            setUserCommentId(userComment.id || null);
            setNewComment(userComment.content || "");
            if (userComment.rating) {
              setUserRating(userComment.rating);
              setHasRated(true);
            }
          } else {
            setHasCommented(false);
            setUserCommentId(null);
            setUserRating(0);
            setHasRated(false);
            setNewComment("");
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
    }
  }, [movieId, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchCommentsAndRatings();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchCommentsAndRatings]);

  // Xử lý chọn sao đánh giá nhanh
  const handleRateMovie = (starValue) => {
    if (!user) {
      alert("Vui lòng đăng nhập để đánh giá phim!");
      return;
    }
    if (hasRated && !isEditing) {
      alert(
        `Bạn đã đánh giá ${userRating}/10 sao. Bạn có thể nhấn "Chỉnh sửa" để đổi đánh giá.`,
      );
      return;
    }
    setUserRating(starValue);
  };

  // Xử lý Gửi / Cập nhật Bình luận
const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      alert("Vui lòng nhập nội dung bình luận!");
      return;
    }

    if (userRating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }

    try {
      setSubmitting(true);

      // Payload gọn gàng, khớp chính xác với CommentCreate schema
      const payload = {
        content: newComment.trim(),
        rating: Number(userRating),
      };

      if (isEditing && userCommentId) {
        await api.put(`/movies/${movieId}/comments/${userCommentId}/`, payload);
        alert("Cập nhật bình luận thành công!");
      } else {
        await api.post(`/movies/${movieId}/comments/`, payload);
        alert("Đăng bình luận thành công!");
      }

      setIsEditing(false);
      await fetchCommentsAndRatings();
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error.response?.data || error.message);
      alert(error.response?.data?.detail || "Đã xảy ra lỗi xác thực hoặc lỗi hệ thống.");
    } finally {
      setSubmitting(false);
    }
  };

  // Mở chế độ chỉnh sửa
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setIsEditing(false);
    const userComment = comments.find(
      (c) => String(c.user_id) === String(user?.id),
    );
    if (userComment) {
      setNewComment(userComment.content || "");
      setUserRating(userComment.rating || 0);
    }
  };

  // Xóa Bình luận / Đánh giá
  const handleDeleteComment = async () => {
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa đánh giá & bình luận này?")
    ) {
      return;
    }

    try {
      if (userCommentId) {
        // SỬA: Bỏ /api thừa
        await api.delete(`/movies/${movieId}/comments/${userCommentId}/`);
      }

      alert("Đã xóa bình luận & đánh giá thành công!");
      setIsEditing(false);
      await fetchCommentsAndRatings();
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      alert("Không thể xóa bình luận. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="movie-comments-container">
      {/* 1. KHU VỰC ĐÁNH GIÁ PHIM */}
      <div className="rating-section">
        <h2 className="rating-title">Đánh giá phim</h2>
        <div className="rating-stars-wrapper">
          <div className="stars-list">
            {[...Array(10)].map((_, index) => {
              const starValue = index + 1;
              const activeStar =
                hoverRating || userRating || Math.round(avgRating);
              const isDisabled = hasRated && !isEditing;
              return (
                <span
                  key={starValue}
                  className={`star-icon ${starValue <= activeStar ? "filled" : ""} ${isDisabled ? "disabled" : ""}`}
                  onMouseEnter={() => !isDisabled && setHoverRating(starValue)}
                  onMouseLeave={() => !isDisabled && setHoverRating(0)}
                  onClick={() => handleRateMovie(starValue)}
                  title={
                    isDisabled
                      ? `Bạn đã đánh giá ${userRating}/10 sao`
                      : `Đánh giá ${starValue}/10 sao`
                  }
                >
                  ★
                </span>
              );
            })}
          </div>
          <span className="rating-score-text">
            {userRating > 0 ? (
              <>
                Đánh giá của bạn:{" "}
                <strong style={{ color: "#ffc107" }}>{userRating}/10 ★</strong>
              </>
            ) : avgRating > 0 ? (
              <>
                <strong>{avgRating}</strong> / 10 (
                {totalRatings || comments.length} đánh giá)
              </>
            ) : (
              "Chưa có đánh giá nào"
            )}
          </span>
        </div>
      </div>

      {/* 2. KHU VỰC BÌNH LUẬN */}
      <div className="comments-section">
        <h3>Bình luận ({comments.length})</h3>

        {/* Khung Thông báo đã bình luận (khi không ở chế độ sửa) */}
        {hasCommented && !isEditing ? (
          <div className="already-commented-box">
            <span>✅ Bạn đã gửi đánh giá & bình luận cho bộ phim này.</span>
            <div className="comment-action-buttons">
              <button className="btn-edit-comment" onClick={handleStartEdit}>
                ✏️ Chỉnh sửa
              </button>
              <button
                className="btn-delete-comment"
                onClick={handleDeleteComment}
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        ) : (
          /* Form Nhập / Chỉnh sửa Bình luận */
          <form onSubmit={handleSubmitComment} className="comment-form">
            {isEditing && (
              <div className="editing-banner">
                ✏️ Đang ở chế độ chỉnh sửa bình luận
              </div>
            )}

            <div className="comment-input-wrapper">
              <textarea
                className="comment-textarea"
                placeholder={
                  user
                    ? "Viết bình luận của bạn..."
                    : "Vui lòng đăng nhập để bình luận..."
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!user || submitting}
                rows={3}
              />
            </div>

            <div className="comment-form-actions">
              <div className="select-rating-inline">
                <span>Chọn số sao đánh giá: </span>
                {[...Array(10)].map((_, index) => {
                  const starVal = index + 1;
                  return (
                    <span
                      key={starVal}
                      className={`small-star ${starVal <= userRating ? "active" : ""}`}
                      onClick={() => setUserRating(starVal)}
                    >
                      ★
                    </span>
                  );
                })}
                <span className="rating-val-num">
                  {userRating > 0 ? `${userRating}/10` : ""}
                </span>
              </div>

              <div className="form-submit-group">
                {isEditing && (
                  <button
                    type="button"
                    className="cancel-edit-btn"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="submit-comment-btn"
                  disabled={!user || submitting}
                >
                  {submitting
                    ? "Đang gửi..."
                    : isEditing
                      ? "Cập nhật"
                      : "Gửi bình luận"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Danh sách bình luận */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          ) : (
            comments.map((item, index) => {
              const isOwner =
                user?.id && String(item.user_id) === String(user.id);

              return (
                <div
                  key={item.id || index}
                  className={`comment-item ${isOwner ? "owner-item" : ""}`}
                >
                  <img
                    src={item.avatar || "https://placehold.co/40x40?text=U"}
                    alt="avatar"
                    className="comment-avatar"
                  />
                  <div className="comment-content-box">
                    <div className="comment-header">
                      <span className="comment-author">
                        {item.username || "Người dùng"}
                      </span>
                      {isOwner && <span className="owner-badge">(Bạn)</span>}
                      {item.rating > 0 && (
                        <span className="comment-user-badge">
                          ★ {item.rating}/10
                        </span>
                      )}
                      <span className="comment-time">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="comment-text">{item.content}</p>

                    {/* Nút thao tác nhanh cho chủ bình luận */}
                    {isOwner && !isEditing && (
                      <div className="item-inline-actions">
                        <button
                          className="btn-link-edit"
                          onClick={handleStartEdit}
                        >
                          Sửa
                        </button>
                        <span>•</span>
                        <button
                          className="btn-link-delete"
                          onClick={handleDeleteComment}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
