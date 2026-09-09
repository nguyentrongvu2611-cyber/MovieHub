import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom"; // Đổi sang HashRouter
import { Provider } from "react-redux";

import App from "./App.jsx";
import store from "./store";
import "./assets/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>,
);
