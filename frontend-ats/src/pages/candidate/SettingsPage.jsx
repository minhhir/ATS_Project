import { useState, useRef, useEffect } from 'react';
import { CandidateLayout } from '@/layout/CandidateLayout';
import { Button } from '@/ui/Button';
import { User, Camera, FileText, UploadCloud, CheckCircle, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';

export function SettingsPage() {
    // ✅ FIX 1: Dùng updateUser thay cho login
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [skills, setSkills] = useState(''); // ✅ FIX 4: Thêm State Skills

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [cvFile, setCvFile] = useState(null);
    const [currentCv, setCurrentCv] = useState(null);

    const avatarInputRef = useRef(null);
    const cvInputRef = useRef(null);

    // ✅ FIX 3 & 4: Load dữ liệu chuẩn từ user object
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setSkills(user.skills?.join(', ') || '');
            setAvatarPreview(user.avatar || null);
            setCurrentCv(user.cvUrl || null);
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCvChange = (e) => {
        const file = e.target.files[0];
        if (file) setCvFile(file);
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccessMsg('');
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('phone', phone);
            formData.append('skills', skills); // ✅ FIX 4: Gửi skills

            if (avatarFile) formData.append('avatar', avatarFile);
            if (cvFile) formData.append('cv', cvFile);

            const { data } = await api.put('/auth/profile', formData);

            // ✅ FIX 2: Đồng bộ User state toàn cục ngay lập tức
            updateUser(data.data);
            setCurrentCv(data.data.cvUrl); // ✅ FIX 3: Cập nhật lại Link CV mới

            setSuccessMsg('Đã cập nhật thông tin thành công!');
            setAvatarFile(null);
            setCvFile(null);

        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu!');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    return (
        <CandidateLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main mb-2">Cài đặt tài khoản</h1>
                    <p className="text-text-muted font-medium">Quản lý thông tin cá nhân và hồ sơ ứng tuyển của bạn.</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                    <h3 className="text-xl font-bold text-text-main mb-6 border-b border-border pb-4">Thông tin cơ bản</h3>

                    <div className="flex flex-col sm:flex-row gap-8 items-start mb-8">
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 rounded-full border-4 border-surface bg-surface overflow-hidden shadow-sm flex items-center justify-center">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-text-muted" />
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
                            <button onClick={() => avatarInputRef.current.click()} className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors bg-primary/10 px-4 py-2 rounded-xl">
                                <Camera size={16} /> Đổi ảnh
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-2">Họ và tên</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-2">Số điện thoại</label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-2">Email (Không thể đổi)</label>
                                <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-border bg-gray-100 text-text-muted font-medium cursor-not-allowed outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* ✅ FIX 4: Render UI Kỹ năng */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-text-main mb-2">
                            <BrainCircuit size={18} className="text-primary" /> Kỹ năng chuyên môn
                        </label>
                        <input
                            type="text"
                            placeholder="Ví dụ: React, Node.js, Python, UI/UX (Phân cách bằng dấu phẩy)"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <p className="text-xs text-text-muted mt-2 font-medium">Dùng dấu phẩy để ngăn cách các kỹ năng của bạn.</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                    <h3 className="text-xl font-bold text-text-main mb-6 border-b border-border pb-4">Quản lý CV gốc</h3>

                    <div>
                        <input type="file" accept=".pdf" className="hidden" ref={cvInputRef} onChange={handleCvChange} />
                        <div
                            onClick={() => cvInputRef.current.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${cvFile ? 'border-primary bg-primary-light/30' : 'border-border hover:border-primary hover:bg-surface'}`}
                        >
                            <UploadCloud className={`mx-auto mb-3 ${cvFile ? 'text-primary' : 'text-text-muted'}`} size={40} />
                            {cvFile ? (
                                <div className="font-bold text-primary truncate px-4">{cvFile.name}</div>
                            ) : (
                                <>
                                    <div className="font-bold text-text-main mb-2 text-lg">Click để tải lên CV mặc định</div>
                                    <div className="text-sm text-text-muted font-medium">Chỉ hỗ trợ định dạng PDF (Max 5MB)</div>
                                </>
                            )}
                        </div>

                        {currentCv && !cvFile && (
                            <div className="mt-4 p-4 bg-surface rounded-xl border border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-text-main text-sm">CV hiện tại của bạn</div>
                                        <div className="text-xs text-text-muted font-medium">Đã tải lên hệ thống</div>
                                    </div>
                                </div>
                                <a href={currentCv} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">
                                    Xem CV
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} isLoading={loading} className="py-3 px-8 text-base">
                        Lưu thay đổi
                    </Button>
                    {successMsg && (
                        <span className="flex items-center gap-2 text-success font-bold animate-in fade-in slide-in-from-left-4">
                            <CheckCircle size={20} /> {successMsg}
                        </span>
                    )}
                </div>
            </div>
            <ChangePasswordForm />
        </CandidateLayout>
    );
}