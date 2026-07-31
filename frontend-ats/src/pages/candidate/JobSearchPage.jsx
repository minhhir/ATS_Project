import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import { SkeletonCard } from '@/ui/Skeleton';
import api from '@/api/axios';
import { Search, MapPin, Wallet, Clock, Filter, ChevronDown } from 'lucide-react';

// Class dùng chung cho các <select> lọc. Gom lại một chỗ để 6 ô lọc không trôi mỗi ô một kiểu.
const selectClasses =
    'form-select w-full h-11 pl-3 pr-9 rounded-sm border border-border bg-white text-sm text-text-main ' +
    'cursor-pointer transition-colors duration-200 ease-smooth hover:border-border-strong ' +
    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

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
    // Vấn đề: Gửi field rỗng ('') vào params sẽ làm BE filter sai (vd location='' khớp regex empty); UI dropdown lương dùng string preset trong khi BE cần Min/Max number.
    // Giải pháp: Build params chỉ từ field có giá trị, switch-case map "1000-2000" thành { salaryMin, salaryMax } đúng schema BE.
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.location) params.location = filters.location;
            if (filters.experience) params.experience = filters.experience;
            if (filters.level) params.level = filters.level;
            if (filters.type) params.type = filters.type;

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

    const resetFilters = () => setFilters({ keyword: '', location: '', salary: '', experience: '', level: '', type: '' });

    // Format tiền tệ cho đẹp trên UI
    const formatSalary = (min, max) => {
        if (!min && !max) return 'Thỏa thuận';
        if (!min) return `Lên đến $${max}`;
        if (!max) return `Từ $${min}`;
        return `$${min} - $${max}`;
    };

    // Vấn đề: Empty state chỉ nói "Không tìm thấy kết quả" thì ứng viên không biết nên làm gì —
    // do hệ thống chưa có tin, hay do chính họ lọc quá hẹp?
    // Giải pháp: Đếm số điều kiện đang bật để tách hai tình huống và viết hai câu khác nhau.
    // Đây chỉ là suy ra từ state có sẵn để hiển thị, không can thiệp vào params gửi lên API.
    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <CandidateLayout>
            {/* Tiêu đề căn trái, cỡ 28px weight 600 — không phải khối hero nền tint với chữ
                căn giữa cỡ display. Đây là trang làm việc, không phải trang bán hàng. */}
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Tìm việc làm</h1>
                <p className="text-sm text-text-muted mt-1">
                    Lọc theo địa điểm, mức lương và kinh nghiệm để thu hẹp danh sách.
                </p>
            </div>

            {/* Panel lọc: phân vùng bằng viền 1px, không shadow, không nền tint */}
            <section className="border border-border rounded-lg bg-surface-raised p-4">
                <form onSubmit={handleSearch} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5">
                            <label htmlFor="filter-keyword" className="block text-xs font-semibold text-text-main mb-1.5">
                                Từ khóa
                            </label>
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none"
                                    aria-hidden="true"
                                />
                                <input
                                    id="filter-keyword"
                                    name="keyword" value={filters.keyword} onChange={handleChange}
                                    type="text" placeholder="Tên vị trí, ví dụ: Frontend Developer"
                                    className="w-full h-11 pl-9 pr-3 rounded-sm border border-border bg-white text-sm text-text-main placeholder:text-text-subtle transition-colors duration-200 ease-smooth hover:border-border-strong focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            <label htmlFor="filter-location" className="block text-xs font-semibold text-text-main mb-1.5">
                                Địa điểm
                            </label>
                            <select id="filter-location" name="location" value={filters.location} onChange={handleChange} className={selectClasses}>
                                <option value="">Tất cả địa điểm</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="filter-experience" className="block text-xs font-semibold text-text-main mb-1.5">
                                Kinh nghiệm
                            </label>
                            <select id="filter-experience" name="experience" value={filters.experience} onChange={handleChange} className={selectClasses}>
                                <option value="">Tất cả</option>
                                <option value="không yêu cầu">Không yêu cầu</option>
                                <option value="<1 năm">Dưới 1 năm</option>
                                <option value="1-2 năm">1 - 2 năm</option>
                                <option value="3-5 năm">3 - 5 năm</option>
                                <option value=">5 năm">Trên 5 năm</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex items-end">
                            <Button type="submit" fullWidth>Tìm kiếm</Button>
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            aria-expanded={showAdvanced}
                            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            <Filter size={15} aria-hidden="true" />
                            Lọc nâng cao
                            <ChevronDown size={15} aria-hidden="true" className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border-subtle animate-in fade-in duration-200">
                                <div>
                                    <label htmlFor="filter-salary" className="block text-xs font-semibold text-text-main mb-1.5">Mức lương</label>
                                    <select id="filter-salary" name="salary" value={filters.salary} onChange={handleChange} className={selectClasses}>
                                        <option value="">Tất cả mức lương</option>
                                        <option value="<1000">Dưới $1,000</option>
                                        <option value="1000-2000">$1,000 - $2,000</option>
                                        <option value="2000-3000">$2,000 - $3,000</option>
                                        <option value=">3000">Trên $3,000</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="filter-level" className="block text-xs font-semibold text-text-main mb-1.5">Cấp bậc</label>
                                    <select id="filter-level" name="level" value={filters.level} onChange={handleChange} className={selectClasses}>
                                        <option value="">Tất cả cấp bậc</option>
                                        <option value="intern">Thực tập sinh</option>
                                        <option value="fresher">Fresher</option>
                                        <option value="junior">Junior</option>
                                        <option value="mid">Middle</option>
                                        <option value="senior">Senior</option>
                                        <option value="lead">Giám đốc / Lead</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="filter-type" className="block text-xs font-semibold text-text-main mb-1.5">Hình thức</label>
                                    <select id="filter-type" name="type" value={filters.type} onChange={handleChange} className={selectClasses}>
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
                </form>
            </section>

            {/* Số kết quả dùng aria-live để screen reader biết danh sách vừa đổi sau khi bấm Tìm kiếm */}
            <div className="flex items-end justify-between gap-4">
                <p className="text-sm text-text-muted" aria-live="polite">
                    {loading ? 'Đang tải danh sách…' : (
                        <>
                            <span className="font-semibold text-text-main">{jobs.length}</span> vị trí đang tuyển
                            {activeFilterCount > 0 && ` · ${activeFilterCount} điều kiện lọc`}
                        </>
                    )}
                </p>
                {activeFilterCount > 0 && !loading && (
                    <Button variant="ghost" size="sm" onClick={resetFilters}>Xóa bộ lọc</Button>
                )}
            </div>

            {loading ? (
                // Skeleton giữ đúng khung 4 card sắp hiện, thay cho spinner giữa màn hình:
                // danh sách không "nhảy dựng" khi data về và ứng viên thấy ngay sắp có gì.
                <div className="space-y-3" aria-busy="true" aria-label="Đang tải danh sách việc làm">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : jobs.length === 0 ? (
                // Hai câu khác nhau cho hai tình huống khác nhau — ứng viên cần biết lỗi ở phía nào.
                <div className="border border-border rounded-lg bg-surface-raised p-10 max-w-xl">
                    {activeFilterCount > 0 ? (
                        <>
                            <h2 className="text-base font-semibold text-text-main">
                                Không có vị trí nào khớp với {activeFilterCount} điều kiện bạn đang chọn
                            </h2>
                            <p className="text-sm text-text-muted mt-2">
                                Thử bỏ bớt một điều kiện — mức lương và kinh nghiệm là hai bộ lọc thu hẹp kết quả nhiều nhất.
                            </p>
                            <Button variant="outline" size="sm" className="mt-5" onClick={resetFilters}>
                                Xóa tất cả bộ lọc
                            </Button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-base font-semibold text-text-main">
                                Hiện chưa có tin tuyển dụng nào đang mở
                            </h2>
                            <p className="text-sm text-text-muted mt-2">
                                Các nhà tuyển dụng chưa đăng tin mới. Bạn có thể quay lại sau, hoặc hoàn thiện hồ sơ và CV
                                trước để nộp được ngay khi có vị trí phù hợp.
                            </p>
                            <Link
                                to="/candidate/settings"
                                className="inline-flex items-center justify-center h-9 px-3 mt-5 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                            >
                                Hoàn thiện hồ sơ
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                // Danh sách một cột thay cho lưới 3 cột đều nhau: mắt quét dọc một trục nhanh hơn
                // quét zigzag, và tên vị trí dài không bị cắt giữa chữ như trong ô lưới hẹp.
                <ul className="space-y-3">
                    {jobs.map((job) => (
                        <li key={job._id}>
                            <Link
                                to={`/jobs/${job._id}`}
                                onKeyDown={(e) => {
                                    if (e.key === ' ') {
                                        e.preventDefault();
                                        e.currentTarget.click();
                                    }
                                }}
                                className="group block border border-border rounded-lg bg-surface-raised p-4 transition-colors duration-200 ease-smooth hover:border-border-strong hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-sm border border-border bg-surface flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={job.recruiter?.companyLogo || `https://ui-avatars.com/api/?name=${job.recruiter?.companyName || 'C'}&background=f1f5f9&color=475569`}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                            {job.title}
                                        </h3>
                                        <p className="text-sm text-text-muted truncate mt-0.5">
                                            {job.recruiter?.companyName || 'Công ty ẩn danh'}
                                        </p>
                                    </div>

                                    {job.isFeatured && (
                                        // "Tin nổi bật" là trạng thái thật của tin, không phải nhãn trang trí.
                                        // Dùng chip viền nhạt thay vì nền warning đặc chữ trắng in hoa.
                                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-sm border border-warning-100 bg-warning-50 text-xs font-medium text-warning-700 shrink-0">
                                            Tin nổi bật
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                        <Wallet size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        {formatSalary(job.salaryMin, job.salaryMax)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                        <MapPin size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                                        {job.location || 'Toàn quốc'}
                                    </span>
                                    {job.experience && (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-border text-xs font-medium text-text-muted">
                                            <Clock size={13} className="text-text-subtle shrink-0" aria-hidden="true" />
                                            {job.experience}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </CandidateLayout>
    );
}
