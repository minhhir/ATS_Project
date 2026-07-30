import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Building } from 'lucide-react';

// Vấn đề: Job card xuất hiện ở landing/search/related; nếu mỗi nơi tự render layout khác nhau sẽ vỡ design system; logo có thể null nên cần fallback.
// Giải pháp: Component dùng chung nhận prop job, fallback ui-avatars khi không có logo, Link tới /jobs/:id để click bất kỳ chỗ nào trên card cũng vào chi tiết.
export function JobCard({ job }) {
    return (
        <Link
            to={`/jobs/${job.id}`}
            className="block bg-white p-6 rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
        >
            <div className="flex items-start justify-between gap-4">
                {/* Logo & Info */}
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl border border-border flex items-center justify-center bg-surface p-2 shrink-0 group-hover:border-primary/20 transition-colors">
                        <img
                            src={job.logo || `https://ui-avatars.com/api/?name=${job.company}&background=e0f2fe&color=0284c7`}
                            alt={job.company}
                            className="w-full h-full object-contain rounded-lg"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">
                            {job.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-text-muted mt-1 font-medium">
                            <Building size={16} />
                            <span className="text-sm">{job.company}</span>
                        </div>
                    </div>
                </div>

                {/* Bookmark/Action (Tùy chọn) */}
                <div className="hidden sm:block">
                    <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full">
                        Đang tuyển
                    </span>
                </div>
            </div>

            {/* Meta info */}
            <div className="mt-5 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6">
                <div className="flex items-center gap-1.5 text-text-muted">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-sm font-medium">{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                    <DollarSign size={16} className="text-success" />
                    <span className="text-sm font-medium">{job.salary}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                    <Clock size={16} className="text-warning" />
                    <span className="text-sm font-medium">{job.type}</span>
                </div>
            </div>

            {/* Skills/Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
                {job.skills?.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-surface border border-border text-text-main text-xs font-semibold rounded-md">
                        {skill}
                    </span>
                ))}
            </div>
        </Link>
    );
}