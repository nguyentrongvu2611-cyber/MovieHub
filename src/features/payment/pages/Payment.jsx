import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createPayment,
  checkPaymentStatus,
  approvePayment,
} from "../paymentService";
import "./Payment.css";

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [expiredAt, setExpiredAt] = useState(null);

  const hasCreatedPayment = useRef(false);

  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const plan = searchParams.get("plan");

  const plans = {
    "1month": {
      name: "Premium 1 tháng",
      price: 99000,
      duration: 1,
      prefix: "MOVIEHUB",
    },
    "6months": {
      name: "Premium 6 tháng",
      price: 399000,
      duration: 6,
      prefix: "MOVIEHUB6T",
    },
    "12months": {
      name: "Premium 12 tháng",
      price: 699000,
      duration: 12,
      prefix: "MOVIEHUB12T",
    },
  };

  const selectedPlan = plans[plan];

  const userId = user?.id;
  const paymentUserId = userId ? String(userId).padStart(8, "0") : "";
  const paymentPrefix = selectedPlan ? selectedPlan.prefix : "MOVIEHUB";
  const paymentContent = `${paymentPrefix} ${paymentUserId}`;

  const BANK_ID = "MB";
  const ACCOUNT_NO = "0326112473";
  const ACCOUNT_NAME = "NGUYEN TRONG VU";

  const qrUrl = selectedPlan
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
      `?amount=${selectedPlan.price}` +
      `&addInfo=${encodeURIComponent(paymentContent)}` +
      `&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : "";

  // Helper format ngày giờ chuẩn Việt Nam
  const formatDateVN = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    }).format(date);
  };

  const updateUserToPremium = (extraData = {}) => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = {
      ...savedUser,
      ...extraData,
      is_premium: true,
      role: savedUser.role === "admin" ? "admin" : "premium",
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("userChanged"));
  };

  // 1. Tạo đơn thanh toán 1 lần duy nhất
  useEffect(() => {
    if (!userId || !plan || hasCreatedPayment.current) return;

    hasCreatedPayment.current = true;

    const initPayment = async () => {
      try {
        const res = await createPayment(userId, plan);
        if (res?.payment_id) {
          setCurrentPaymentId(res.payment_id);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo đơn thanh toán:", err);
      }
    };

    initPayment();
  }, [userId, plan]);

  // 2. Polling tự động kiểm tra mỗi 3 giây
  useEffect(() => {
    if (!userId || submitted || !currentPaymentId) return;

    const checkIsApproved = (res) => {
      if (!res) return false;

      const status = res?.latest_payment_status || res?.payment_status || "";
      const paymentId = res?.latest_payment_id || res?.payment_id;

      const validStatuses = ["approved", "success", "completed", "paid"];
      const isStatusOk = validStatuses.includes(String(status).toLowerCase());
      const isIdMatch = String(paymentId) === String(currentPaymentId);

      return isStatusOk && isIdMatch;
    };

    const interval = setInterval(async () => {
      try {
        setChecking(true);
        const res = await checkPaymentStatus(userId);

        if (checkIsApproved(res)) {
          updateUserToPremium(res.user || {});
          setExpiredAt(res.premium_expired_at || res.user?.premium_expired_at);
          setSubmitted(true);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Lỗi tự động kiểm tra thanh toán:", error);
      } finally {
        setChecking(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, submitted, currentPaymentId]);

  // 3. Xử lý khi bấm nút xác nhận thủ công
  const handlePaymentSubmitted = async () => {
    if (!currentPaymentId || !userId) {
      alert("Chưa khởi tạo được mã giao dịch!");
      return;
    }

    try {
      setChecking(true);
      const res = await approvePayment(currentPaymentId);

      updateUserToPremium(res?.user || {});
      setExpiredAt(res?.premium_expired_at || res?.user?.premium_expired_at);
      setSubmitted(true);
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      alert(error.response?.data?.detail || "Không thể xác nhận thanh toán!");
    } finally {
      setChecking(false);
    }
  };

  if (!user || !selectedPlan) {
    return (
      <div className="payment-page">
        <h2>Không tìm thấy thông tin thanh toán</h2>
        <button onClick={() => navigate("/premium")}>Quay lại</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="waiting-icon">🎉</div>
          <h1>Thanh toán thành công!</h1>
          <p>
            Tài khoản của bạn đã được nâng cấp lên{" "}
            <strong>{selectedPlan.name}</strong>.
          </p>
          {expiredAt && (
            <p className="expired-text">
              Hạn dùng Premium đến: <strong>{formatDateVN(expiredAt)}</strong>
            </p>
          )}
          <p>Chúc bạn có trải nghiệm xem phim vui vẻ!</p>
          <button onClick={() => navigate("/")}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h1>Thanh toán Premium</h1>
        <h2>{selectedPlan.name}</h2>

        <div className="payment-price">
          {selectedPlan.price.toLocaleString("vi-VN")}đ
        </div>

        <img className="payment-qr" src={qrUrl} alt="Mã QR thanh toán" />

        <div className="payment-info">
          <p>
            <strong>Nội dung chuyển khoản:</strong>
          </p>

          <div className="payment-content">{paymentContent}</div>

          <p>Vui lòng chuyển đúng số tiền và đúng nội dung.</p>

          <div className="auto-check-status">
            <span className={`spinner-dot ${checking ? "spinning" : ""}`}>
              🔄
            </span>
            <small>
              {checking
                ? "Đang kiểm tra giao dịch..."
                : "Hệ thống đang chờ thanh toán..."}
            </small>
          </div>
        </div>

        <button className="paid-btn" onClick={handlePaymentSubmitted}>
          ✓ Tôi đã chuyển khoản xong
        </button>
      </div>
    </div>
  );
}
