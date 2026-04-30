import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layout/AdminLayout';
import { Trash2, UserX, ShieldCheck, Mail } from 'lucide-react';
import api from '@/api/axios';

export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // GỌI API THẬT
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/admin/users');
                setUsers(data.data);
            } catch (error) {
                console.error('Lỗi tải người dùng:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này? Toàn bộ dữ liệu của họ sẽ bị mất!')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            alert('Đã xóa người dùng thành công!');
        } catch {
            alert('Có lỗi xảy ra khi xóa!');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-text-main">Quản lý Người dùng</h1>
                <p className="text-text-muted mt-1 font-medium">Kiểm soát tài khoản ứng viên và nhà tuyển dụng trên hệ thống.</p>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface text-text-muted text-sm uppercase tracking-wider">
                                <th className="p-5 font-bold">Người dùng</th>
                                <th className="p-5 font-bold">Liên hệ</th>
                                <th className="p-5 font-bold">Vai trò</th>
                                <th className="p-5 font-bold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center font-bold text-text-muted">Đang tải dữ liệu...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="4" className="p-10 text-center font-bold text-text-muted">Chưa có người dùng nào.</td></tr>
                            ) : users.map((u) => (
                                <tr key={u._id} className="hover:bg-surface/50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-bold text-text-main text-base">{u.name}</div>
                                        <div className="text-xs text-text-muted mt-1">ID: {u._id}</div>
                                    </td>
                                    <td className="p-5 text-sm font-medium text-text-muted">
                                        <div className="flex items-center gap-2"><Mail size={14} /> {u.email}</div>
                                    </td>
                                    <td className="p-5">
                                        {u.role === 'admin' ? (
                                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-danger/10 text-danger flex items-center gap-1 w-max"><ShieldCheck size={14} /> Admin</span>
                                        ) : (
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full w-max ${u.role === 'candidate' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {u.role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        {u.role !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(u._id)} className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors" title="Xóa tài khoản">
                                                <UserX size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}