const axios = require('axios');
const Application = require('../models/Application');

exports.triggerAIScoring = async (applicationId, data = null) => {
    let cvUrl, jdText;

    if (data) {
        // Fast path: data được truyền từ controller, không cần query DB thêm
        ({ cvUrl, jdText } = data);
    } else {
        // Slow path: dùng khi retrigger thủ công
        const app = await Application.findById(applicationId).populate('job', 'requirements');
        if (!app || !app.job) {
            console.error('[AI Service]: Application hoặc Job không tồn tại');
            return;
        }
        cvUrl = app.cvUrl;
        jdText = app.job.requirements;
    }

    // Dùng updateOne thay vì findById → save() — không cần load toàn bộ document
    await Application.updateOne({ _id: applicationId }, { aiStatus: 'processing' });

    // Fallback: tránh gửi undefined sang Python → Python validate fail → 400
    if (!cvUrl) {
        console.error('[AI Service]: cvUrl bị undefined, bỏ qua.');
        await Application.updateOne({ _id: applicationId }, { aiStatus: 'error' });
        return;
    }
    const safejdText = jdText || '';

    try {
        const payload = { cv_url: cvUrl, jd_text: safejdText };
        console.log('[AI Service] Payload gửi Python:', JSON.stringify(payload).slice(0, 200));

        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/score`,
            payload,
            { timeout: 30000 }
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

exports.batchScoreByJob = async (jobId) => {
    const apps = await Application.find({
        job: jobId,
        aiStatus: { $in: ['pending', 'error'] }
    }).populate('job', 'requirements').lean();

    if (!apps.length) return 0;

    const CHUNK_SIZE = 5;
    for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
        const chunk = apps.slice(i, i + CHUNK_SIZE);
        await Promise.all(
            chunk.map(app =>
                exports.triggerAIScoring(app._id, {
                    cvUrl: app.cvUrl,
                    jdText: app.job?.requirements || ''
                }).catch(err => console.error(`[Batch Score] app ${app._id}:`, err.message))
            )
        );
    }
    return apps.length;
};