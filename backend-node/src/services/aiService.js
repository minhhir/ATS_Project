const axios = require('axios');
const Application = require('../models/Application');

// Vấn đề: Apply xong gọi AI service trong cùng request sẽ làm response chậm 5-30s; controller đã có sẵn data, không nên query DB lại.
// Giải pháp: Hàm chạy "fire-and-forget" sau khi response, hỗ trợ fast path (nhận data trực tiếp) và slow path (tự query khi retry thủ công).
exports.triggerAIScoring = async (applicationId, data = null) => {
    let cvUrl, jdText, jdSkills;

    if (data) {
        // Fast path: data được truyền từ controller, không cần query DB thêm
        ({ cvUrl, jdText, jdSkills } = data);
    } else {
        // Vấn đề: Khi admin retrigger 1 application cũ, không có sẵn data, phải tự lấy từ DB.
        // Giải pháp: Slow path tự populate job để build jdText/jdSkills.
        const app = await Application.findById(applicationId)
            .populate('job', 'description requirements skills');
        if (!app || !app.job) {
            console.error('[AI Service]: Application hoặc Job không tồn tại');
            return;
        }
        cvUrl = app.cvUrl;
        jdText = `${app.job.description || ''}\n\n${app.job.requirements || ''}`;
        jdSkills = app.job.skills;
    }

    // Vấn đề: findById + save() sẽ load toàn bộ document chỉ để đổi 1 field.
    // Giải pháp: updateOne nhẹ hơn, chỉ ghi đúng field cần đổi.
    await Application.updateOne({ _id: applicationId }, { aiStatus: 'processing' });

    // Vấn đề: Gửi cv_url=undefined sang Python sẽ làm Pydantic validate fail và trả 422.
    // Giải pháp: Sanitize input phía Node, đánh dấu aiStatus=error nếu thiếu cvUrl thay vì gọi service vô ích.
    if (!cvUrl) {
        console.error('[AI Service]: cvUrl bị undefined, bỏ qua.');
        await Application.updateOne({ _id: applicationId }, { aiStatus: 'error' });
        return;
    }
    const safeJdText = jdText || '';
    const safeJdSkills = Array.isArray(jdSkills) ? jdSkills.filter(Boolean) : [];

    try {
        const payload = { cv_url: cvUrl, jd_text: safeJdText, jd_skills: safeJdSkills };
        console.log('[AI Service] Payload gửi Python:', JSON.stringify({ ...payload, jd_text: safeJdText.slice(0, 80) }).slice(0, 280));

        // Vấn đề: Lần đầu gọi Python service phải load model SentenceTransformer mất 1-2 phút, default timeout axios sẽ ngắt giữa chừng.
        // Giải pháp: Nâng timeout lên 60s để giữ kết nối qua giai đoạn warm-up.
        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/score`,
            payload,
            { timeout: 60000 }
        );
        await Application.updateOne({ _id: applicationId }, {
            aiScore: response.data.score,
            aiSummary: response.data.summary,
            aiStatus: 'done'
        });
    } catch (err) {
        await Application.updateOne({ _id: applicationId }, { aiStatus: 'error' });
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error('[AI Service Error]:', detail);
    }
};

// Vấn đề: HR cần re-score toàn bộ ứng viên của 1 job (vd sau khi sửa JD), gọi tuần tự thì chậm, gọi song song hết một lúc lại làm Python OOM.
// Giải pháp: Chia nhỏ thành chunk 5 application chạy song song, lần lượt từng chunk; mỗi item bọc catch để 1 lỗi không kill cả batch.
exports.batchScoreByJob = async (jobId) => {
    const apps = await Application.find({
        job: jobId,
        aiStatus: { $in: ['pending', 'error'] }
    }).populate('job', 'description requirements skills').lean();

    if (!apps.length) return 0;

    const CHUNK_SIZE = 5;
    for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
        const chunk = apps.slice(i, i + CHUNK_SIZE);
        await Promise.all(
            chunk.map(app =>
                exports.triggerAIScoring(app._id, {
                    cvUrl: app.cvUrl,
                    jdText: `${app.job?.description || ''}\n\n${app.job?.requirements || ''}`,
                    jdSkills: app.job?.skills || []
                }).catch(err => console.error(`[Batch Score] app ${app._id}:`, err.message))
            )
        );
    }
    return apps.length;
};
