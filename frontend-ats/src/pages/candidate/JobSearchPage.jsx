import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import api from '@/api/axios';
import { Search, MapPin, DollarSign, Briefcase, Filter, ChevronDown, Loader2, Building, Clock } from 'lucide-react';

export function JobSearchPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Form Filters
    const [filters, setFilters] = useState({
        keyword: '', location: '', salary: '', experience: '', level: '', type: ''
    });

    const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    // Build params để gửi xuống API
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.location) params.location = filters.location;
            if (filters.experience) params.experience = filters.experience;
            if (filters.level) params.level = filters.level;
            if (filters.type) params.type = filters.type;

            // Logic map Mức lương (string) ra Min/Max (VND) để Backend hiểu
            if (filters.salary) {
                switch (filters.salary) {
                    case '<1000': params.salaryMax = 1000; break;
                    case '1000-2000': params.salaryMin = 1000; params.salaryMax = 2000; break;
                    case '2000-3000': params.salaryMin = 2000; params.salaryMax = 3000; break;
                    case '>3000': params.salaryMin = 3000; break;
                    default: break;
                }
            }

            const { data } = await api.get('/jobs', { params });
            setJobs(data.data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách việc làm:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load lần đầu khi vào trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchJobs(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJobs();
    };

    // Format tiền tệ cho đẹp trên UI
    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!min) return `Lên đến $${max}`;
        if (!max) return `Từ $${min}`;
        return `$${min} - $${max}`;
    };

    return (
        <CandidateLayout>
            {/* HERO BAR - Thanh công cụ tìm kiếm chuẩn TopCV */}
            <div className="bg-primary/5 rounded-3xl p-6 sm:p-8 mb-10 border border-primary/10">
                <h1 className="text-2xl sm:text-3xl font-black text-text-main mb-6 text-center">
                    Tìm kiếm công việc mơ ước của bạn
                </h1>

                <form onSubmit={handleSearch} className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-border p-2">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">

                        {/* 1. Keyword */}
                        <div className="md:col-span-4 flex items-center px-4 py-2 md:border-r border-border">
                            <Search className="text-text-muted shrink-0 mr-3" size={20} />
                            <input
                                name="keyword" value={filters.keyword} onChange={handleChange}
                                type="text" placeholder="Tên công việc, vị trí..."
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-text-main placeholder:text-text-muted outline-none"
                            />
                        </div>

                        {/* 2. Địa điểm */}
                        <div className="md:col-span-3 flex items-center px-4 py-2 md:border-r border-border">
                            <MapPin className="text-primary shrink-0 mr-3" size={20} />
                            <select name="location" value={filters.location} onChange={handleChange} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-text-main cursor-pointer outline-none appearance-none">
                                <option value="">Tất cả địa điểm</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                            </select>
                        </div>

                        {/* 3. Kinh nghiệm */}
                        <div className="md:col-span-3 flex items-center px-4 py-2">
                            <Briefcase className="text-warning shrink-0 mr-3" size={20} />
                            <select name="experience" value={filters.experience} onChange={handleChange} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-text-main cursor-pointer outline-none appearance-none">
                                <option value="">Tất cả kinh nghiệm</option>
                                <option value="không yêu cầu">Không yêu cầu</option>
                                <option value="<1 năm">Dưới 1 năm</option>
                                <option value="1-2 năm">1 - 2 năm</option>
                                <option value="3-5 năm">3 - 5 năm</option>
                                <option value=">5 năm">Trên 5 năm</option>
                            </select>
                        </div>

                        {/* Nút Tìm Kiếm */}
                        <div className="md:col-span-2 px-2 pb-2 md:pb-0 md:px-0">
                            <Button type="submit" className="w-full h-full min-h-[44px] rounded-xl text-base shadow-sm">Tìm kiếm</Button>
                        </div>
                    </div>
                </form>

                {/* Bộ lọc nâng cao */}
                <div className="max-w-5xl mx-auto mt-4">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                        <Filter size={16} /> Lọc nâng cao <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {showAdvanced && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            {/* Mức lương */}
                            <div className="bg-white px-4 py-2.5 rounded-xl border border-border flex items-center">
                                <DollarSign size={18} className="text-success mr-2 shrink-0" />
                                <select name="salary" value={filters.salary} onChange={handleChange} className="w-full text-sm font-semibold outline-none appearance-none cursor-pointer">
                                    <option value="">Tất cả mức lương</option>
                                    <option value="<1000">Dưới $1,000</option>
                                    <option value="1000-2000">$1,000 - $2,000</option>
                                    <option value="2000-3000">$2,000 - $3,000</option>
                                    <option value=">3000">Trên $3,000</option>
                                </select>
                            </div>

                            {/* Cấp bậc */}
                            <div className="bg-white px-4 py-2.5 rounded-xl border border-border flex items-center">
                                <select name="level" value={filters.level} onChange={handleChange} className="w-full text-sm font-semibold outline-none appearance-none cursor-pointer">
                                    <option value="">Tất cả cấp bậc</option>
                                    <option value="intern">Thực tập sinh</option>
                                    <option value="fresher">Fresher</option>
                                    <option value="junior">Junior</option>
                                    <option value="mid">Middle</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Giám đốc / Lead</option>
                                </select>
                            </div>
                            {/* Hình thức làm việc */}
                            <div className="bg-white px-4 py-2.5 rounded-xl border border-border flex items-center">
                                <select name="type" value={filters.type} onChange={handleChange} className="w-full text-sm font-semibold outline-none appearance-none cursor-pointer">
                                    <option value="">Tất cả hình thức</option>
                                    <option value="full-time">Toàn thời gian</option>
                                    <option value="part-time">Bán thời gian</option>
                                    <option value="remote">Remote</option>
                                    <option value="contract">Hợp đồng</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DANH SÁCH CÔNG VIỆC */}
            <div className="mb-6 flex justify-between items-end">
                <h2 className="text-xl font-extrabold text-text-main">
                    Tìm thấy <span className="text-primary">{jobs.length}</span> việc làm phù hợp
                </h2>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <span className="font-semibold text-text-muted">Đang quét dữ liệu...</span>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-16 text-center shadow-sm">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-text-muted opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">Không tìm thấy kết quả</h3>
                    <p className="text-text-muted font-medium">Thử thay đổi từ khóa hoặc mở rộng bộ lọc xem sao nhé.</p>
                    <Button variant="outline" className="mt-6" onClick={() => setFilters({ keyword: '', location: '', salary: '', experience: '', level: '', type: '' })}>
                        Xóa tất cả bộ lọc
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Inline Job Card để đảm bảo an toàn tuyệt đối, không bị crash do thiếu Import */}
                    {jobs.map((job) => (
                        <Link key={job._id} to={`/jobs/${job._id}`} className="block group">
                            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col relative overflow-hidden">
                                {job.isFeatured && (
                                    <div className="absolute top-0 right-0 bg-warning text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                                        Hot
                                    </div>
                                )}

                                <div className="flex gap-4 mb-4">
                                    <div className="w-14 h-14 bg-surface rounded-xl border border-border flex items-center justify-center shrink-0 p-2">
                                        <img
                                            src={job.recruiter?.companyLogo || `https://ui-avatars.com/api/?name=${job.recruiter?.companyName || 'C'}&background=e0f2fe&color=0284c7`}
                                            alt="Logo"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-main leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                            {job.title}
                                        </h3>
                                        <div className="text-sm font-medium text-text-muted truncate">
                                            {job.recruiter?.companyName || 'Công ty ẩn danh'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface text-xs font-semibold text-text-muted">
                                        <DollarSign size={14} className="text-success" />
                                        {formatSalary(job.salaryMin, job.salaryMax)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface text-xs font-semibold text-text-muted">
                                        <MapPin size={14} className="text-primary" />
                                        {job.location || 'Toàn quốc'}
                                    </span>
                                    {job.experience && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface text-xs font-semibold text-text-muted">
                                            <Briefcase size={14} className="text-warning" />
                                            {job.experience}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </CandidateLayout>
    );
}