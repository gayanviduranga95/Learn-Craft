
const API_BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const authApi = {
  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  me: () => request("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
};


export const courseApi = {
  async getCourses() {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load courses.");
    }

    return data.courses;
  },

  async updateProgress(courseId, completedLessonIds) {
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/progress`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ completedLessonIds }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update course progress.");
    }

    return data;
  },
};

