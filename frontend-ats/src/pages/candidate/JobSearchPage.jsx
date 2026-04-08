import { useState } from 'react';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { JobCard } from '@/components/candidate/JobCard';
import { Button } from '@/ui/Button';
import { Search, MapPin, Briefcase } from 'lucide-react';

// Dữ liệu giả lập (Sau này thay bằng gọi API Axios)
const MOCK_JOBS = [
    { id: 1, title: 'Senior Frontend Developer (React)', company: 'TechNova Solutions', location: 'Hà Nội', salary: '1500$ - 2500$', type: 'Toàn thời gian', skills: ['React', 'TypeScript', 'Tailwind'] },
    { id: 2, title: 'Backend Engineer (Node.js)', company: 'Global Pay', location: 'TP. Hồ Chí Minh', salary: '1200$ - 2000$', type: 'Từ xa', skills: ['Node.js', 'MongoDB', 'Redis'] },
    { id: 3, title: 'UI/UX Designer', company: 'Creative Studio', location: 'Đà Nẵng', salary: '800$ - 1500$', type: 'Toàn thời gian', skills: ['Figma', 'Prototyping', 'Design System'] },
    { id: 4, title: 'DevOps Engineer', company: 'CloudScale', location: 'Hà Nội', salary: '2000$ - 3500$', type: 'Toàn thời gian', skills: ['AWS', 'Docker', 'Kubernetes'] },
];

export function JobSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <CandidateLayout>
            {/* Hero Search Section */}
            <div className="bg-primary rounded-3xl p-8 sm:p-12 mb-10 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">Tìm kiếm công việc mơ ước của bạn</h1>
                    <p className="text-primary-light text-lg font-medium mb-8">Khám phá hàng ngàn cơ hội việc làm từ các công ty công nghệ hàng đầu.</p>

                    <div className="flex flex-col sm:flex-row bg-white rounded-2xl p-2 gap-2 shadow-sm">
                        <div className="flex-1 flex items-center px-4 gap-3 bg-surface rounded-xl border border-transparent focus-within:border-primary/30 transition-colors">
                            <Search size={20} className="text-text-muted" />
                            <input
                                type="text"
                                placeholder="Vị trí, từ khóa hoặc công ty..."
                                className="w-full bg-transparent border-none py-3 focus:outline-none text-text-main font-medium placeholder:text-text-muted/70"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:flex flex-1 items-center px-4 gap-3 bg-surface rounded-xl border border-transparent focus-within:border-primary/30 transition-colors">
                            <MapPin size={20} className="text-text-muted" />
                            <input
                                type="text"
                                placeholder="Địa điểm..."
                                className="w-full bg-transparent border-none py-3 focus:outline-none text-text-main font-medium placeholder:text-text-muted/70"
                            />
                        </div>
                        <Button className="py-3 px-8 rounded-xl text-base h-auto">Tìm việc</Button>
                    </div>
                </div>
            </div>

            {/* Section Title & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-text-main">Việc làm đề xuất</h2>
                    <p className="text-text-muted font-medium mt-1">Dựa trên hồ sơ của bạn</p>
                </div>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {MOCK_JOBS.map(job => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>
        </CandidateLayout>
    );
}