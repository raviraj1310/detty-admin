import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const storedToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          localStorage.removeItem("userId");
          localStorage.removeItem("user_role");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("userId");
          sessionStorage.removeItem("user_role");
        } catch {}
        try {
          window.dispatchEvent(new CustomEvent("auth:updated", { detail: { isLoggedIn: false } }));
        } catch {}
        try {
          if (window.location && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        } catch {}
      }
    }
    return Promise.reject(error);
  }
);

export default api;
