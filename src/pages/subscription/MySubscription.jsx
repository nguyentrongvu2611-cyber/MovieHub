import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MySubscription.css";

const BACKEND_URL = "http://127.0.0.1:8000";

function MySubscription() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Danh sách gói cước cố định từ component Premium
  const packages = [
    {
      id: "1month",
      name: "1 Tháng",
      price: 99000,
      duration: 1,
      screens: "+1 màn hình xem phim",
    },
    {
      id: "6months",
      name: "6 Tháng",
      price: 399000,
      duration: 6,
      popular: true,
      screens: "+2 màn hình xem phim",
    },
    {
      id: "12months",
      name: "12 Tháng",
      price: 699000,
      duration: 12,
      screens: "+10 màn hình xem phim",
    },
  ];

  useEffect(() => {
    const fetchSubInfo = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions/me`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSubInfo(data);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin gói cước:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubInfo();
  }, [user]);

  const handleBuy = (plan) => {
    if (!user) {
      alert("Vui lòng đăng nhập để mua gói Premium");
      navigate("/login");
      return;
    }

    navigate(`/payment?plan=${plan.id}`);
  };

  if (loading) {
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: "50px" }}>
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="premium-page">
      {/* THÔNG TIN GÓI CƯỚC CỦA BẠN */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "40px",
          maxWidth: "800px",
          margin: "0 auto 40px auto",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#fff" }}>
          Thông Tin Gói Cước Của Bạn
        </h2>

        {subInfo ? (
          <div style={{ lineHeight: "1.8", color: "#ddd" }}>
            <p>
              <strong>Gói hiện tại:</strong>{" "}
              {subInfo.plan_name || "Gói Premium VIP"}
            </p>
            <p>
              <strong>Ngày kích hoạt:</strong> {subInfo.start_date}
            </p>
            <p>
              <strong>Ngày hết hạn:</strong> {subInfo.end_date}
            </p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <span style={{ color: "#4caf50", fontWeight: "bold" }}>
                Đang hoạt động
              </span>
            </p>
          </div>
        ) : (
          <p style={{ color: "#aaa" }}>
            Tài khoản của bạn hiện đang kích hoạt quyền truy cập Premium.
          </p>
        )}
      </div>

      {/* MUA THÊM / GIA HẠN GÓI CƯỚC */}
      <div className="premium-header">
        <h1>🚀 Mua Thêm / Gia Hạn Gói Cước</h1>
        <p>Mở khóa toàn bộ kho phim và trải nghiệm xem phim không giới hạn.</p>
      </div>

      <div className="premium-packages">
        {packages.map((plan) => (
          <div
            key={plan.id}
            className={plan.popular ? "premium-card popular" : "premium-card"}
          >
            {plan.popular && <div className="popular-badge">Phổ biến nhất</div>}

            <h2>{plan.name}</h2>

            <div className="premium-price">
              {plan.price.toLocaleString("vi-VN")}đ
            </div>

            <p>Xem toàn bộ phim Premium</p>
            <p>Chất lượng xem phim tốt hơn</p>
            <p>Không giới hạn số lượng phim</p>

            <p className="screen-info">📺 {plan.screens}</p>

            <button onClick={() => handleBuy(plan)} className="buy-premium-btn">
              Gia hạn ngay
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MySubscription;
