const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  signup(payload) {
    return request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  runTest(payload) {
    return request("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  dashboard(userEmail) {
    return request(`/api/dashboard?userEmail=${encodeURIComponent(userEmail)}`);
  },

  endpoints(userEmail) {
    return request(`/api/endpoints?userEmail=${encodeURIComponent(userEmail)}`);
  },

  endpointDetail(userEmail, url) {
    return request(
      `/api/endpoints/${encodeURIComponent(url)}?userEmail=${encodeURIComponent(userEmail)}`,
    );
  },

  resultById(userEmail, id) {
    return request(
      `/api/results/${encodeURIComponent(id)}?userEmail=${encodeURIComponent(userEmail)}`,
    );
  },
};
