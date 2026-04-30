const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Chỉ chấp nhận file PDF hoặc Hình ảnh!', 400), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: fileFilter
});

const uploadToCloudinary = (fileBuffer, originalName, isImage = false) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fileBuffer) return reject(new AppError('Không tìm thấy dữ liệu', 400));

            const safeName = originalName
                ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
                : 'file';
            const publicId = `${Date.now()}_${safeName}`;

            // ✅ CẤU HÌNH ĐÃ ĐƯỢC CHUẨN HÓA LẠI
            const options = isImage ? {
                folder: "mini_ats_avatars",
                resource_type: "image",
                public_id: publicId
            } : {
                folder: "mini_ats_cvs",
                resource_type: "auto", // Dùng auto để Cloudinary tự nhận diện PDF
                public_id: publicId + ".pdf" // Nối sẵn đuôi pdf để trình duyệt không bị lỗi khi tải về
            };

            let stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    console.error('Cloudinary Error:', error);
                    return reject(new AppError('Lỗi tải file lên mây', 500));
                }
                resolve(result);
            });

            const readStream = streamifier.createReadStream(fileBuffer);
            readStream.pipe(stream);
        } catch (err) {
            reject(new AppError('Lỗi hệ thống', 500));
        }
    });
};
module.exports = { upload, uploadToCloudinary };