import { useState, useEffect } from 'react';

export function useDarkMode() {
    // Khởi tạo state dark mode từ localStorage hoặc theo prefers-color-scheme
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    // Khi dark mode thay đổi, cập nhật class trên root và lưu vào localStorage
    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [dark]);
    // Toggle function để component gọi khi user muốn đổi theme
    const toggle = () => setDark(d => !d);
    return [dark, toggle];
}