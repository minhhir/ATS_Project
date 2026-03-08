const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

//Lưu file vào RAM (Không lưu xuống ổ cứng)
const storage = multer.memoryStorage();

// Lọc chỉ nhận PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        const err = new Error('Hệ thống chỉ chấp nhận định dạng file PDF!');
        err.statusCode = 400;
        cb(err, false);
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
        const safeName = originalName
            ? originalName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]/g, '_')
            : 'cv';
        const publicId = `${Date.now()}_${safeName}`;

        let stream = cloudinary.uploader.upload_stream(
            {
                folder: "mini_ats_cvs",
                resource_type: "raw",
                public_id: publicId
            },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

module.exports = { upload, uploadToCloudinary };