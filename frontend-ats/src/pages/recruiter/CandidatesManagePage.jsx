import { useState, useEffect, useMemo, useId } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RecruiterLayout } from '@/layout/RecruiterLayout';
import { Skeleton } from '@/ui/Skeleton';
import { FileText, AlertTriangle, Star, Search, X, Info, RotateCw } from 'lucide-react';
import api from '@/api/axios';

const controlClasses =
    'h-9 px-2.5 rounded-sm border border-border bg-white text-sm text-text-main ' +
    'transition-colors duration-200 ease-smooth hover:border-border-strong ' +
    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25';

// Vấn đề: HR nhìn con số "82/100" mà không biết nó đo cái gì, dễ hiểu nhầm thành đánh giá năng lực
// ứng viên và loại thẳng người điểm thấp.
// Giải pháp: Tooltip CSS-only (không cần state) nói rõ điểm đo gì và không thay cho việc đọc CV.
// Dùng group-focus-within nên bàn phím Tab tới nút là tooltip hiện, không chỉ hover chuột.
function ScoreHelp() {
    const tipId = useId();
    return (
        <span className="relative inline-flex group align-middle">
            <button
                type="button"
                aria-label="Điểm khớp CV nghĩa là gì?"
                aria-describedby={tipId}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-text-subtle hover:text-text-main transition-colors cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
                <Info size={13} aria-hidden="true" />
            </button>
            {/* Tooltip là lớp nổi thật sự nên được dùng shadow, khác với card tĩnh */}
            <span
                role="tooltip"
                id={tipId}
                className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-200 absolute left-0 bottom-full mb-2 z-30 w-72 rounded-2xl border border-border bg-white p-3 text-xs font-normal normal-case tracking-normal text-text-muted shadow-lg"
            >
                <span className="block font-semibold text-text-main mb-1">Điểm khớp CV</span>
                Hệ thống so kỹ năng ghi trong CV với danh sách kỹ năng bạn nhập ở tin tuyển dụng.
                <span className="block mt-1.5">
                    Từ 80: khớp phần lớn yêu cầu · 50–79: khớp một phần · Dưới 50: ít khớp.
                </span>
                <span className="block mt-1.5">
                    Đây là điểm gợi ý để sắp thứ tự đọc, không thay cho việc tự xem CV.
                </span>
            </span>
        </span>
    );
}

// Giữ NGUYÊN logic hiển thị điểm: processing/pending → đang xử lý, error → lỗi,
// còn lại → điểm với 3 dải màu. Chỉ đổi cách trình bày.
function AiScore({ app }) {
    if (app.aiStatus === 'processing' || app.aiStatus === 'pending') {
        return <span className="text-sm text-text-muted">Đang chấm…</span>;
    }
    if (app.aiStatus === 'error') {
        return <span className="text-sm font-medium text-danger">Lỗi</span>;
    }
    const score = app.aiScore ?? 0;
    const band = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';
    const bandLabel = score >= 80 ? 'khớp phần lớn yêu cầu' : score >= 50 ? 'khớp một phần' : 'ít khớp';
    return (
        <span className="text-sm font-semibold tabular-nums" title={`${score}/100 — ${bandLabel}`}>
            <span className={band}>{score}</span>
            <span className="text-text-subtle font-normal">/100</span>
        </span>
    );
}

export function CandidatesManagePage() {
    const [searchParams] = useSearchParams();
    const initialJobId = searchParams.get('jobId') || 'all';

    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(initialJobId);
    const [loading, setLoading] = useState(true);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [scoreFilter, setScoreFilter] = useState(''); // '', 'high', 'medium', 'low'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [onlyFeatured, setOnlyFeatured] = useState(false);
    const [sort, setSort] = useState('score');

    // Vấn đề: User gõ tìm kiếm sẽ gọi API mỗi keystroke → spam server và làm UI giật.
    // Giải pháp: Debounce 400ms — chỉ commit keyword vào state debounced khi user dừng gõ, useEffect cleanup clearTimeout để reset timer mỗi keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
        return () => clearTimeout(t);
    }, [keyword]);

    // Vấn đề: Build query string mỗi render dù filter không đổi sẽ tạo string mới gây useEffect ở dưới chạy lại không cần thiết.
    // Giải pháp: useMemo cache query string theo deps; chỉ rebuild khi filter thực sự đổi.
    const queryString = useMemo(() => {
        const p = new URLSearchParams();
        if (debouncedKeyword) p.set('keyword', debouncedKeyword);
        if (scoreFilter) p.set('scoreFilter', scoreFilter);
        if (dateFrom) p.set('dateFrom', dateFrom);
        if (dateTo) p.set('dateTo', dateTo);
        if (onlyFeatured) p.set('featured', 'true');
        if (sort) p.set('sort', sort);
        const q = p.toString();
        return q ? `?${q}` : '';
    }, [debouncedKeyword, scoreFilter, dateFrom, dateTo, onlyFeatured, sort]);

    const hasActiveFilter =
        debouncedKeyword || scoreFilter || dateFrom || dateTo || onlyFeatured;

    const resetFilters = () => {
        setKeyword('');
        setScoreFilter('');
        setDateFrom('');
        setDateTo('');
        setOnlyFeatured(false);
        setSort('score');
    };

    // Lấy danh sách Job đưa vào Dropdown
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await api.get('/jobs/recruiter');
                setJobs(data.data);
            } catch { console.error('Lỗi lấy Jobs'); }
        };
        fetchJobs();
    }, []);

    // Lấy danh sách Ứng viên theo Job + filter
    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/applications/job/${selectedJob}${queryString}`);
                setApplications(data.data);
            } catch { console.error('Lỗi lấy Ứng viên'); }
            setLoading(false);
        };
        fetchApps();
    }, [selectedJob, queryString]);

    // Toggle đánh dấu nổi bật
    const handleToggleFeatured = async (appId) => {
        try {
            const { data } = await api.patch(`/applications/${appId}/feature`);
            setApplications(apps =>
                apps.map(app => app._id === appId ? { ...app, isFeatured: data.isFeatured } : app)
            );
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi cập nhật trạng thái nổi bật');
        }
    };

    // Đổi trạng thái (Đang chờ, Từ chối, Nhận...)
    const handleStatusChange = async (appId, status) => {
        try {
            await api.patch(`/applications/${appId}/status`, { status });
            setApplications(apps => apps.map(app => app._id === appId ? { ...app, status } : app));
        } catch { alert('Lỗi cập nhật trạng thái'); }
    };

    // Vấn đề: Trúng tuyển và Từ chối là hai trạng thái ứng viên nhìn thấy ngay và khó rút lại;
    // chọn nhầm một dòng trong danh sách dài là chuyện xảy ra thật.
    // Giải pháp: Hỏi lại trước khi gọi, nêu rõ tên ứng viên. Bọc ở nơi GỌI nên handleStatusChange
    // giữ nguyên không đổi. Nếu HR bấm Hủy, <select> là controlled nên tự quay về giá trị cũ.
    const confirmStatusChange = (app, status) => {
        const label = status === 'offered' ? 'gửi offer cho' : status === 'rejected' ? 'từ chối' : null;
        if (label) {
            const name = app.candidate?.name || 'ứng viên này';
            if (!window.confirm(`Xác nhận ${label} ${name}? Ứng viên sẽ thấy trạng thái mới ngay khi bạn đồng ý.`)) return;
        }
        handleStatusChange(app._id, status);
    };

    // Báo cáo ứng viên (CV giả mạo, thông tin sai lệch...)
    const handleReport = async (appId) => {
        const reason = window.prompt('Nhập lý do báo cáo ứng viên này (v dụ: CV giả mạo, thông tin sai lệch):');
        if (!reason) return;

        try {
            await api.post(`/applications/${appId}/report`, { reason });
            alert('Đã gửi báo cáo cho Quản trị viên xử lý!');
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi gửi báo cáo');
        }
    };
    // Chấm lại điểm AI (chạy nền, poll lại danh sách sau vài giây)
    // Vấn đề: AI scoring chạy nền 5-10s, nếu không feedback user sẽ tưởng nút bị treo và bấm lại; cần refresh để hiển thị điểm mới mà không bắt user F5.
    // Giải pháp: Optimistic set aiStatus='processing' ngay → alert thông báo → setTimeout 8s tự refetch để FE pull điểm về.
    const handleReScore = async (appId) => {
        try {
            await api.post(`/applications/${appId}/score`);
            setApplications(apps => apps.map(app => app._id === appId ? { ...app, aiStatus: 'processing' } : app));
            alert('Đang gửi CV sang server Python để phân tích. Điểm sẽ tự cập nhật sau 5-10 giây.');
            setTimeout(async () => {
                try {
                    const { data } = await api.get(`/applications/job/${selectedJob}`);
                    setApplications(data.data);
                } catch { /* bỏ qua */ }
            }, 8000);
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi! Hãy kiểm tra Terminal Node.js và Python.');
        }
    };

    // Giữ nguyên điều kiện hiện nút chấm lại: lỗi, hoặc đã chấm xong mà điểm bằng 0.
    const canRescore = (app) =>
        app.aiStatus === 'error' || (app.aiStatus === 'done' && (app.aiScore ?? 0) === 0);

    const statusOptions = [
        { value: 'applied', label: 'Chờ duyệt' },
        { value: 'reviewing', label: 'Đang xem xét' },
        { value: 'shortlisted', label: 'Danh sách rút gọn' },
        { value: 'interviewed', label: 'Đã phỏng vấn' },
        { value: 'offered', label: 'Trúng tuyển' },
        { value: 'rejected', label: 'Từ chối' },
    ];

    return (
        <RecruiterLayout>
            <div>
                <h1 className="text-2xl font-semibold text-text-main">Ứng viên</h1>
                <p className="text-sm text-text-muted mt-1">
                    Xem CV, đổi trạng thái và đánh dấu hồ sơ đáng chú ý.
                </p>
            </div>

            {/* Thanh công cụ — mật độ cao, các control cao 36px xếp một hàng trên desktop */}
            <section className="border border-border rounded-lg bg-surface-raised p-3 space-y-2.5">
                <div className="flex flex-col md:flex-row gap-2.5">
                    <select
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        aria-label="Lọc theo tin tuyển dụng"
                        className={`form-select flex-1 pr-9 ${controlClasses}`}
                    >
                        <option value="all">Tất cả tin tuyển dụng</option>
                        {jobs.map(job => (
                            <option key={job._id} value={job._id}>{job.title}</option>
                        ))}
                    </select>

                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" aria-hidden="true" />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo tên hoặc email ứng viên"
                            aria-label="Tìm ứng viên theo tên hoặc email"
                            className={`w-full pl-8 placeholder:text-text-subtle ${controlClasses}`}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2.5 items-end">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="f-score" className="text-xs text-text-muted">Điểm khớp</label>
                        <select id="f-score" value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className={`form-select pr-8 ${controlClasses}`}>
                            <option value="">Tất cả điểm</option>
                            <option value="high">Cao (≥80)</option>
                            <option value="medium">Trung bình (50–79)</option>
                            <option value="low">Thấp (&lt;50)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="f-from" className="text-xs text-text-muted">Nộp từ</label>
                        <input id="f-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={controlClasses} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="f-to" className="text-xs text-text-muted">Đến</label>
                        <input id="f-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={controlClasses} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="f-sort" className="text-xs text-text-muted">Sắp xếp</label>
                        <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={`form-select pr-8 ${controlClasses}`}>
                            <option value="score">Điểm khớp cao nhất</option>
                            <option value="newest">Nộp mới nhất</option>
                            <option value="oldest">Nộp cũ nhất</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOnlyFeatured(v => !v)}
                        aria-pressed={onlyFeatured}
                        className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-sm border text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            onlyFeatured
                                ? 'border-warning-100 bg-warning-50 text-warning-700 font-semibold'
                                : 'border-border bg-white text-text-muted hover:border-border-strong'
                        }`}
                    >
                        <Star size={14} className={onlyFeatured ? 'fill-current' : ''} aria-hidden="true" />
                        Chỉ nổi bật
                    </button>

                    {hasActiveFilter && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-sm text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            <X size={14} aria-hidden="true" /> Xóa lọc
                        </button>
                    )}
                </div>
            </section>

            {loading ? (
                <div className="border border-border rounded-lg bg-surface-raised p-4 space-y-3" aria-busy="true" aria-label="Đang tải danh sách ứng viên">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            ) : applications.length === 0 ? (
                <div className="border border-border rounded-lg bg-surface-raised p-10 max-w-xl">
                    <h2 className="text-base font-semibold text-text-main">
                        {hasActiveFilter ? 'Không có hồ sơ nào khớp bộ lọc hiện tại' : 'Chưa có ứng viên nào nộp hồ sơ cho vị trí này'}
                    </h2>
                    <p className="text-sm text-text-muted mt-2">
                        {hasActiveFilter
                            ? 'Thử nới khoảng ngày nộp hoặc bỏ điều kiện điểm khớp — đây là hai bộ lọc loại nhiều hồ sơ nhất.'
                            : 'Hồ sơ sẽ xuất hiện ở đây ngay khi có người nộp. Tin có mô tả và kỹ năng rõ ràng thường nhận được hồ sơ khớp hơn.'}
                    </p>
                    {hasActiveFilter && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center h-9 px-3 mt-5 rounded-lg border border-border bg-white text-sm font-semibold text-text-main transition-colors cursor-pointer hover:bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            ) : (
                <div className="border border-border rounded-lg bg-surface-raised overflow-hidden">
                    {/* Bảng mật độ cao cho desktop */}
                    <div className="hidden lg:block scroll-x">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-surface-sunken text-text-muted">
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs w-8">
                                        <span className="sr-only">Đánh dấu nổi bật</span>
                                    </th>
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs">Ứng viên</th>
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs">Vị trí ứng tuyển</th>
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs whitespace-nowrap">
                                        Điểm khớp <ScoreHelp />
                                    </th>
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs">Trạng thái</th>
                                    <th scope="col" className="px-3 py-2.5 font-medium text-xs text-right">Hồ sơ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {applications.map(app => (
                                    <tr key={app._id} className={`transition-colors ${app.isFeatured ? 'bg-warning-50/40' : 'hover:bg-surface'}`}>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFeatured(app._id)}
                                                aria-pressed={Boolean(app.isFeatured)}
                                                aria-label={app.isFeatured
                                                    ? `Bỏ đánh dấu nổi bật cho ${app.candidate?.name}`
                                                    : `Đánh dấu nổi bật cho ${app.candidate?.name}`}
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                                    app.isFeatured ? 'text-warning-700' : 'text-text-subtle hover:text-text-main hover:bg-surface-sunken'
                                                }`}
                                            >
                                                <Star size={15} className={app.isFeatured ? 'fill-current' : ''} aria-hidden="true" />
                                            </button>
                                        </td>

                                        <td className="px-3 py-2">
                                            <div className="font-medium text-text-main">{app.candidate?.name}</div>
                                            <div className="text-xs text-text-subtle">{app.candidate?.email}</div>
                                        </td>

                                        <td className="px-3 py-2 text-text-muted">{app.job?.title}</td>

                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <AiScore app={app} />
                                            {canRescore(app) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReScore(app._id)}
                                                    aria-label={`Chấm lại điểm khớp cho ${app.candidate?.name}`}
                                                    className="ml-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover hover:underline cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                >
                                                    <RotateCw size={12} aria-hidden="true" /> Chấm lại
                                                </button>
                                            )}
                                        </td>

                                        <td className="px-3 py-2">
                                            <select
                                                value={app.status}
                                                onChange={(e) => confirmStatusChange(app, e.target.value)}
                                                aria-label={`Trạng thái hồ sơ của ${app.candidate?.name}`}
                                                className={`form-select h-8 pl-2 pr-7 rounded-sm border text-xs font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25 ${
                                                    app.status === 'offered' ? 'border-success-100 bg-success-50 text-success-700'
                                                        : app.status === 'rejected' ? 'border-danger-100 bg-danger-50 text-danger-700'
                                                            : 'border-border bg-white text-text-main'
                                                }`}
                                            >
                                                {statusOptions.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={app.cvUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`Mở CV của ${app.candidate?.name} trong tab mới`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                >
                                                    <FileText size={16} aria-hidden="true" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReport(app._id)}
                                                    aria-label={`Báo cáo hồ sơ của ${app.candidate?.name} với quản trị viên`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-sm text-text-muted transition-colors cursor-pointer hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                >
                                                    <AlertTriangle size={16} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Dưới lg: 6 cột không đọc được trên màn hẹp nên đổi sang thẻ dọc */}
                    <ul className="lg:hidden divide-y divide-border-subtle">
                        {applications.map(app => (
                            <li key={app._id} className={`px-4 py-3 ${app.isFeatured ? 'bg-warning-50/40' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-text-main truncate">{app.candidate?.name}</div>
                                        <div className="text-xs text-text-subtle truncate">{app.candidate?.email}</div>
                                        <div className="text-sm text-text-muted mt-1">{app.job?.title}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleFeatured(app._id)}
                                        aria-pressed={Boolean(app.isFeatured)}
                                        aria-label={app.isFeatured
                                            ? `Bỏ đánh dấu nổi bật cho ${app.candidate?.name}`
                                            : `Đánh dấu nổi bật cho ${app.candidate?.name}`}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-sm shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                            app.isFeatured ? 'text-warning-700' : 'text-text-subtle hover:text-text-main'
                                        }`}
                                    >
                                        <Star size={16} className={app.isFeatured ? 'fill-current' : ''} aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-text-subtle">Điểm khớp</span>
                                    <ScoreHelp />
                                    <AiScore app={app} />
                                    {canRescore(app) && (
                                        <button
                                            type="button"
                                            onClick={() => handleReScore(app._id)}
                                            aria-label={`Chấm lại điểm khớp cho ${app.candidate?.name}`}
                                            className="text-xs font-medium text-primary hover:underline cursor-pointer rounded-sm"
                                        >
                                            Chấm lại
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <select
                                        value={app.status}
                                        onChange={(e) => confirmStatusChange(app, e.target.value)}
                                        aria-label={`Trạng thái hồ sơ của ${app.candidate?.name}`}
                                        className={`form-select flex-1 h-9 pl-2.5 pr-8 rounded-sm border text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/25 ${
                                            app.status === 'offered' ? 'border-success-100 bg-success-50 text-success-700'
                                                : app.status === 'rejected' ? 'border-danger-100 bg-danger-50 text-danger-700'
                                                    : 'border-border bg-white text-text-main'
                                        }`}
                                    >
                                        {statusOptions.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>

                                    <a
                                        href={app.cvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Mở CV của ${app.candidate?.name} trong tab mới`}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-text-muted hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        <FileText size={16} aria-hidden="true" />
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleReport(app._id)}
                                        aria-label={`Báo cáo hồ sơ của ${app.candidate?.name} với quản trị viên`}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-text-muted hover:bg-danger-50 hover:text-danger cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        <AlertTriangle size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </RecruiterLayout>
    );
}
