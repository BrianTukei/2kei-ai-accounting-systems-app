const { enqueueProcessingJob } = require('../queues/processingQueue');
const logger = require('../utils/logger');
const { createClient } = require('@supabase/supabase-js');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY));
const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)
  : null;

exports.uploadDocument = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { jobType } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        // 1. Create Upload Record
        const { data: uploadLog, error: uploadErr } = await supabase
            .from('uploads')
            .insert({
                user_id: userId,
                file_name: file.originalname,
                file_type: file.mimetype,
                file_size: file.size,
                upload_status: 'uploaded',
                storage_url: 'pending' // Actual S3/Supabase URL here if uploaded
            })
            .select().single();

        if (uploadErr) throw uploadErr;

        // 2. Create Job in DB
        const { data: job, error: jobErr } = await supabase
            .from('processing_jobs')
            .insert({
                user_id: userId,
                job_type: jobType,
                file_name: file.originalname,
                file_url: 'local_buffer', 
                status: 'queued'
            })
            .select().single();

        if (jobErr) throw jobErr;

        // 3. Insert Initial Processing Status
        await supabase.from('processing_status').insert({
            job_id: job.id,
            current_stage: 'uploaded',
            progress_percentage: 0,
            message: 'File uploaded and queued for processing.'
        });

        // 4. Enqueue to Bull
        await enqueueProcessingJob({
            jobId: job.id,
            userId,
            jobType,
            uploadId: uploadLog.id,
            fileData: file.buffer.toString('base64'),
            fileName: file.originalname,
            mimeType: file.mimetype
        });

        res.status(200).json({ message: 'Document queued successfully', jobId: job.id, uploadId: uploadLog.id });
    } catch (error) {
        logger.error('Error queuing document:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

exports.getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { data: job, error: jobErr } = await supabase
            .from('processing_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobErr) throw jobErr;

        const { data: statusLog, error: statusErr } = await supabase
            .from('processing_status')
            .select('*')
            .eq('job_id', jobId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        res.status(200).json({ job, status: statusLog || null });
    } catch (error) {
         res.status(500).json({ error: error.message });
    }
};

exports.getGlobalMonitoring = async (req, res) => {
    try {
        const { data: jobs } = await supabase.from('processing_jobs').select('*').order('created_at', { ascending: false }).limit(50);
        const { data: logs } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(50);
        
        res.json({ jobs: jobs || [], logs: logs || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



const bankStatementParser = require('../parsers/bankStatementParser');
try {
} catch(e) {}
exports.parsePreview = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });
        const parsedData = await bankStatementParser.parseStatementFile(file.buffer, file.mimetype);
        res.status(200).json({ rows: parsedData });
    } catch (error) {
        const logger = require('../utils/logger');
        logger.error('Parse Preview error:', error);
        res.status(400).json({ error: error.message });
    }
};
