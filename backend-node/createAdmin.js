const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User'); // Đảm bảo đường dẫn đúng
require('dotenv').config();

const forceAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('1. Đã kết nối Database...');

        // Tự tay băm mật khẩu bằng bcrypt ngay tại đây
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Dùng updateOne để BỎ QUA hoàn toàn tính năng pre('save') gây nhiễu của Mongoose
        await User.updateOne(
            { email: 'admin@neu.edu.vn' },
            {
                $set: {
                    name: 'Super Admin',
                    password: hashedPassword,
                    role: 'admin',
                    phone: '0123456789'
                }
            },
            { upsert: true } // Lệnh này nghĩa là: Có tài khoản thì ghi đè, chưa có thì đẻ ra mới!
        );

        console.log('✅ Đã ép tạo Admin thành công: admin@neu.edu.vn / admin123');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
};

forceAdmin();