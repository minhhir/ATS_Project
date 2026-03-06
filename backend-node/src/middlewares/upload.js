const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

//Lưu file vào RAM (Không lưu xuống ổ cứng)
const storage = multer.memoryStorage();

//Lọc chỉ nhận PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Hệ thống chỉ chấp nhận định dạng file PDF!'), false);
    }
};

//Khởi tạo Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

//Hàm helper đẩy buffer từ RAM lên Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            {
                folder: "mini_ats_cvs",
                resource_type: "raw" // Đảm bảo Cloudinary xử lý file như một file tài nguyên thô (raw) thay vì ảnh (image)
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