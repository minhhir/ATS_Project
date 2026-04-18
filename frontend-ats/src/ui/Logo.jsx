// src/ui/Logo.jsx
import { Link } from 'react-router-dom';

export function Logo({ className }) {
    return (
        <Link to="/" className={`flex items-center gap-3 ${className || ''}`}>
            <img
                src="/Mini ATS.png"
                alt="Mini ATS Logo"
                className="h-14 w-auto object-contain rounded-lg"
            />
            <span className="text-xl font-extrabold tracking-tight text-text-main">Mini ATS</span>
        </Link>
    );
}