// auth-service.js
const XANO_BASE_URL = "https://x8ki-letl-twmt.n7.xano.io/api:g9e8m6-t";

class AuthService {
  // Check if user is logged in
  static isLoggedIn() {
    return !!localStorage.getItem("token");
  }

  // Get stored token
  static getToken() {
    return localStorage.getItem("token");
  }

  // Get user info
  static getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  // Sign up user
  static async signUp(userData) {
    try {
      const response = await fetch(`${XANO_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Sign up failed");
      }

      return await response.json();
    } catch (error) {
      throw new Error("Sign up failed: " + error.message);
    }
  }

  // Login user
  static async login(email, password) {
    try {
      const response = await fetch(`${XANO_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      // Store token and user data (adjust based on Xano's response structure)
      localStorage.setItem("token", data.authToken || data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw new Error("Login failed: " + error.message);
    }
  }

  // Logout user
  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }

  // Redirect if not logged in
  static requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
    }
  }

  // Redirect if already logged in (for login/signup pages)
  static redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = "todo.html";
    }
  }
}
