import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Premium.css";

function Premium() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

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

  const handleBuy = (plan) => {
    if (!user) {
      alert("Vui lòng đăng nhập để mua gói Premium");

      navigate("/login");

      return;
    }

    navigate(`/payment?plan=${plan.id}`);
  };

  return (
    <div className="premium-page">
      <div className="premium-header">
        <h1> MovieHub Premium</h1>

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

            {/* Dòng hiển thị số màn hình xem phim */}
            <p className="screen-info">📺 {plan.screens}</p>

            <button onClick={() => handleBuy(plan)} className="buy-premium-btn">
              Mua gói
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Premium;
