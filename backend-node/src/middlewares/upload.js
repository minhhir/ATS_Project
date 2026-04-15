const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const AppError = require('../utils/AppError');

// Lưu file vào RAM (Không lưu xuống ổ cứng)
const storage = multer.memoryStorage();

// Lọc chỉ nhận PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new AppError('Hệ thống chỉ chấp nhận định dạng file PDF!', 400), false);
    }
};

// Khởi tạo Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

// Hàm helper đẩy buffer từ RAM lên Cloudinary
const uploadToCloudinary = (fileBuffer, originalName) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fileBuffer) {
                return reject(new AppError('Không tìm thấy dữ liệu file để upload', 400));
            }

            const safeName = originalName
                ? originalName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]/g, '_')
                : 'cv';
            const publicId = `${Date.now()}_${safeName}`;

            let stream = cloudinary.uploader.upload_stream(
                {
                    folder: "mini_ats_cvs",
                    resource_type: "auto", // PDF lưu dạng raw
                    format: "pdf",
                    access_mode: "public",
                    public_id: publicId
                },
                (error, result) => {
                    if (error) {
                        console.error('[Cloudinary Upload Error]:', error);
                        // Trả về AppError chuẩn để controller bắt được và quăng ra frontend
                        return reject(new AppError('Lỗi khi tải file lên máy chủ đám mây', 500));
                    }
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new AppError('Upload thất bại: Không nhận được phản hồi từ server', 500));
                    }
                }
            );

            const readStream = streamifier.createReadStream(fileBuffer);
            readStream.on('error', (err) => {
                console.error('[Streamifier Error]:', err);
                reject(new AppError('Lỗi trong quá trình đọc luồng dữ liệu file', 500));
            });

            // Bơm dữ liệu lên Cloudinary
            readStream.pipe(stream);

        } catch (err) {
            console.error('[Upload Helper Exception]:', err);
            reject(new AppError('Lỗi hệ thống khi khởi tạo tiến trình upload', 500));
        }
    });
};

module.exports = { upload, uploadToCloudinary };