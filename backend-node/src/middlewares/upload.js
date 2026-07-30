const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const AppError = require('../utils/AppError');

// Vấn đề: Lưu file lên đĩa server rồi mới upload Cloudinary tốn 2 lần I/O và rác file tạm.
// Giải pháp: Dùng memoryStorage để giữ buffer trong RAM, sau đó stream thẳng lên Cloudinary.
const storage = multer.memoryStorage();

// Vấn đề: User có thể upload file thực thi (.exe, .js) gây rủi ro bảo mật nếu serve lại.
// Giải pháp: Whitelist mimetype: chỉ chấp nhận PDF (cho CV) hoặc image/* (cho avatar).
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Chỉ chấp nhận file PDF hoặc Hình ảnh!', 400), false);
    }
};

// Vấn đề: File quá lớn sẽ ngốn RAM (vì memoryStorage) và làm chậm/crash service.
// Giải pháp: Cap fileSize ở 5MB, đủ cho CV PDF và ảnh đại diện thông thường.
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: fileFilter
});

// Vấn đề: Cloudinary SDK chỉ có upload_stream callback-based, khó dùng trong code async/await; tên file gốc có thể chứa ký tự đặc biệt phá public_id.
// Giải pháp: Bọc Promise quanh upload_stream + sanitize tên file thành public_id an toàn (chỉ chữ-số-underscore).
const uploadToCloudinary = (fileBuffer, originalName, isImage = false) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fileBuffer) return reject(new AppError('Không tìm thấy dữ liệu', 400));

            // Vấn đề: originalName tiếng Việt có dấu hoặc ký tự đặc biệt sẽ làm public_id Cloudinary lỗi.
            // Giải pháp: Bỏ extension và replace mọi ký tự không phải [a-zA-Z0-9] thành _ trước khi gắn timestamp.
            const safeName = originalName
                ? originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
                : 'file';
            const publicId = `${Date.now()}_${safeName}`;

            // Vấn đề: PDF và ảnh cần resource_type khác nhau; PDF không có đuôi sẽ bị browser refuse khi tải về.
            // Giải pháp: Tách 2 nhánh option và nối sẵn ".pdf" vào public_id của CV.
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

            // Vấn đề: cloudinary.upload_stream cần một Readable stream, nhưng multer trả về Buffer.
            // Giải pháp: Dùng streamifier convert Buffer → Readable rồi pipe vào upload stream.
            const readStream = streamifier.createReadStream(fileBuffer);
            readStream.pipe(stream);
        } catch (err) {
            reject(new AppError('Lỗi hệ thống', 500));
        }
    });
};
module.exports = { upload, uploadToCloudinary };