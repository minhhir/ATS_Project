const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// 1. Lưu file vào RAM (Không lưu xuống ổ cứng)
const storage = multer.memoryStorage();

// 2. Lọc chỉ nhận PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Hệ thống chỉ chấp nhận định dạng file PDF!'), false);
    }
};

// 3. Khởi tạo Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

// 4. Hàm helper đẩy buffer từ RAM lên Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            {
                folder: "mini_ats_cvs",
                resource_type: "auto" // Auto để nhận cả hình ảnh lẫn PDF
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

module.exports = { upload, uploadToCloudinary };