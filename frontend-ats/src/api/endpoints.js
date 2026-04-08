import api from './axios';

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    getMe: () => api.get('/auth/me'),
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const jobsAPI = {
    getAll: (params) => api.get('/jobs', { params }),
    getFeatured: () => api.get('/jobs/featured'),
    getById: (id) => api.get(`/jobs/${id}`),
    create: (data) => api.post('/jobs', data),
    update: (id, data) => api.put(`/jobs/${id}`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
    toggleFeatured: (id) => api.patch(`/jobs/${id}/feature`),
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const applicationsAPI = {
    // Candidate: nộp CV — gửi FormData vì có file
    apply: (jobId, formData) =>
        api.post(`/applications/${jobId}/apply`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Recruiter: xem danh sách ứng viên theo job
    getByJob: (jobId, params) =>
        api.get(`/applications/job/${jobId}`, { params }),

    // Recruiter: cập nhật trạng thái ứng viên
    updateStatus: (id, data) =>
        api.patch(`/applications/${id}/status`, data),

    // Recruiter: đánh dấu ứng viên nổi bật
    toggleFeatured: (id) =>
        api.patch(`/applications/${id}/feature`),

    // Recruiter: trigger AI chấm lại thủ công
    retriggerScore: (id) =>
        api.post(`/applications/${id}/score`),
};