const axios = require('axios');
const Application = require('../models/Application');
const Job = require('../models/Job');

exports.triggerAIScoring = async (applicationId) => {
    const app = await Application.findById(applicationId).populate('job');

    if (!app || !app.job) {
        console.error('[AI Service]: Application hoặc Job không tồn tại (Có thể Job đã bị xóa)');
        return;
    }

    app.aiStatus = 'processing';
    await app.save();

    try {
        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/score`,
            {
                cv_url: app.cvUrl,
                jd_text: app.job.requirements
            },
            { timeout: 30000 }
        );

        app.aiScore = response.data.score;
        app.aiSummary = response.data.summary;
        app.aiStatus = 'done';
    } catch (err) {
        app.aiStatus = 'error';
        console.error('[AI Service Error]:', err.message);
    }

    await app.save();
};