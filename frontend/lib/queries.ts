import api from './api';

// Auth
export async function login(email: string, password: string) {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
}

export async function getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
}

// KPIs
export async function getKPIs(companySlug: string, period?: string) {
    const params = period ? { period } : {};
    const res = await api.get(`/api/kpis/${companySlug}`, { params });
    return res.data;
}

export async function getCompanies() {
    const res = await api.get('/api/kpis/companies/list');
    return res.data;
}

// CSV Upload
export async function uploadCSV(file: File, companySlug: string, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companySlug', companySlug);
    formData.append('type', type);

    const res = await api.post('/api/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

export async function downloadTemplate(type: string) {
    const res = await api.get(`/api/upload-csv/template/${type}`, {
        responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_template.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}
