import axios from "axios";
import { deleteCookie } from "./cookies";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 * Attach token except login
 */
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     // 🚫 Do NOT attach token for login
//     const isLoginApi =
//       config.url?.includes("user/login") ||
//       config.url?.includes("auth/login");

//     if (token && !isLoginApi) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

/**
 * RESPONSE INTERCEPTOR
 */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // optional auto logout
      deleteCookie("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
