const BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleUnauthorized = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return true;
  }
  return false;
};

const parseJson = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    const isUnauthorized = await handleUnauthorized(res);
    if (!isUnauthorized) {
      throw new Error(data.error || "Request failed");
    }
  }
  return data;
};

// ===== AUTH =====
export const login = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  return parseJson(res);
};

export const requestPasswordOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/request-password-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return parseJson(res);
};

export const verifyPasswordOtp = async (email, otp) => {
  const res = await fetch(`${BASE_URL}/auth/verify-password-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  return parseJson(res);
};

export const resetPasswordWithOtp = async (resetToken, newPassword) => {
  const res = await fetch(`${BASE_URL}/auth/reset-password-with-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword }),
  });

  return parseJson(res);
};

// ===== EMPLOYEES =====
export const getEmployees = async () => {
  const res = await fetch(`${BASE_URL}/employees`, {
    headers: getAuthHeaders(),
  });
  return parseJson(res);
};

// ✅ FIX: dùng FormData
export const addEmployee = async (formData) => {
  const res = await fetch(`${BASE_URL}/employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData //
  });
  return parseJson(res);
};

// ✅ FIX: update cũng hỗ trợ upload
export const updateEmployee = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: formData //
  });
  return parseJson(res);
};

export const deleteEmployee = async (id) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseJson(res);
};

// ===== PROJECTS =====
export const getProjects = async () => {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: getAuthHeaders(),
  });
  return parseJson(res);
};

// (project chưa cần upload → giữ JSON)
export const addProject = async (data) => {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  return parseJson(res);
};

export const updateProject = async (id, data) => {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  return parseJson(res);
};

export const deleteProject = async (id) => {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return parseJson(res);
};
