// src/ui/Logo.jsx
import { Link } from 'react-router-dom';

export function Logo({ className }) {
    return (
        <Link to="/" className={`flex items-center gap-2 ${className || ''}`}>
            <div className="w-8 h-8 bg-primary rounded-lg text-white flex items-center justify-center font-bold text-lg shadow-sm">M</div>
            <span className="text-xl font-extrabold tracking-tight text-text-main">Mini ATS</span>
        </Link>
    );
}