import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Auto-unwrap Laravel resource wrapper { data: <payload> } so hooks
// receive the payload directly via res.data without double-nesting.
api.interceptors.response.use(
    (response: AxiosResponse) => {
        const body = response.data;
        if (
            body &&
            typeof body === 'object' &&
            !Array.isArray(body) &&
            'data' in body
        ) {
            const keys = Object.keys(body).filter(
                (k) => k !== 'meta' && k !== 'links',
            );
            if (keys.length === 1 && keys[0] === 'data') {
                response.data = body.data;
            }
        }
        return response;
    },
    (error: AxiosError<{ message?: string }>) => {
        const message =
            error.response?.data?.message || 'Đã xảy ra lỗi kết nối.';
        toast.error(message);
        return Promise.reject(error);
    },
);

export default api;
