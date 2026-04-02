import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: 'http://localhost/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor nếu cần xử lý authToken hoặc lỗi tập trung
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ message?: string }>) => {
        const message = error.response?.data?.message || 'Đã xảy ra lỗi kết nối.';
        toast.error(message);
        return Promise.reject(error);
    }
);

export default api;
