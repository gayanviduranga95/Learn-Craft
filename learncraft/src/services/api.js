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

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = typeof data === "object" && data?.message ? data.message : "Something went wrong.";
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = typeof data === "object" ? data : null;
    throw err;
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

  google: (googleData) =>
    request("/auth/google", {
      method: "POST",
      body: JSON.stringify(googleData),
    }),

  me: () => request("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
};

export const courseApi = {
  async getCourses() {
    const data = await request("/courses", { method: "GET" });
    return data.courses || [];
  },

  async getCourseById(courseId) {
    const data = await request(`/courses/${courseId}`, { method: "GET" });
    return data.course;
  },

  async enrol(courseId) {
    return request(`/courses/${courseId}/enrol`, { method: "POST" });
  },

  async createCourse(courseData) {
    return request("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  },

  async updateCourse(courseId, updateData) {
    return request(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  async deleteCourse(courseId) {
    return request(`/courses/${courseId}`, {
      method: "DELETE",
    });
  },

  async getInstructorCourses() {
    const data = await request("/courses/instructor/my-courses", { method: "GET" });
    return data.courses || [];
  },

  async getCourseStats(courseId) {
    return request(`/courses/${courseId}/stats`, { method: "GET" });
  },

  async updateProgress(courseId, completedLessonIds) {
    return request(`/courses/${courseId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ completedLessonIds }),
    });
  },
};

export const lessonApi = {
  async getCourseLessons(courseId) {
    return request(`/lessons/courses/${courseId}`, { method: "GET" });
  },

  async completeLesson(courseId, lessonId) {
    return request(`/lessons/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: "POST",
    });
  },

  async createLesson(courseId, lessonData) {
    return request(`/lessons/courses/${courseId}`, {
      method: "POST",
      body: JSON.stringify(lessonData),
    });
  },

  async updateLesson(lessonId, updateData) {
    return request(`/lessons/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  async deleteLesson(lessonId) {
    return request(`/lessons/${lessonId}`, {
      method: "DELETE",
    });
  },
};

export const quizApi = {
  async getCourseQuizzes(courseId) {
    const data = await request(`/quizzes/courses/${courseId}`, { method: "GET" });
    return data.quizzes || [];
  },

  async getQuizById(quizId) {
    const data = await request(`/quizzes/${quizId}`, { method: "GET" });
    return data.quiz;
  },

  async submitQuiz(quizId, answers) {
    return request(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  async createQuiz(quizData) {
    return request("/quizzes", {
      method: "POST",
      body: JSON.stringify(quizData),
    });
  },

  async updateQuiz(quizId, quizData) {
    return request(`/quizzes/${quizId}`, {
      method: "PUT",
      body: JSON.stringify(quizData),
    });
  },

  async deleteQuiz(quizId) {
    return request(`/quizzes/${quizId}`, {
      method: "DELETE",
    });
  },

  async getQuizStats(quizId) {
    return request(`/quizzes/${quizId}/stats`, { method: "GET" });
  },
};

export const certificateApi = {
  async checkEligibility(courseId) {
    return request(`/certificates/${courseId}/eligibility`, { method: "GET" });
  },

  async downloadCertificate(courseId, courseTitle = "Course") {
    const response = await fetch(`${API_BASE_URL}/certificates/${courseId}/download`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      let errorMsg = "Unable to download certificate.";
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch {
        // use fallback
      }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LearnCraft_Certificate_${courseTitle.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async verifyCertificate(certificateId) {
    return request(`/certificates/verify/${certificateId}`, { method: "GET" });
  },
};

export const aiApi = {
  async chat(message, history = [], context = {}) {
    return request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, context }),
    });
  },
};
