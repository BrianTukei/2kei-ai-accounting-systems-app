const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = hasSupabaseConfig
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Get all broadcasts
exports.getBroadcasts = async (req, res) => {
  try {
    const { data: broadcasts, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: broadcasts?.length || 0, data: broadcasts || [] });
  } catch (error) {
    logger.error('Error fetching broadcasts', { error: error.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Create a new draft broadcast
exports.createBroadcast = async (req, res) => {
  try {
    const { name, subject, message, recipient_group, specific_recipients, filters, scheduled_at } = req.body;
    
    // Default to 'draft' or 'scheduled' if scheduled_at is provided
    const status = scheduled_at ? 'scheduled' : 'draft';

    const { data, error } = await supabase
      .from('broadcasts')
      .insert([{
        name,
        subject,
        message,
        recipient_group,
        specific_recipients: specific_recipients || [],
        filters: filters || {},
        status,
        scheduled_at: scheduled_at || null,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ success: true, data });
  } catch (error) {
    logger.error('Error creating broadcast', { error: error.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
};

// Update an existing broadcast
exports.updateBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Prevent updating a broadcast that is processing or sent
        const { data: existing, error: checkError } = await supabase
            .from('broadcasts')
            .select('status')
            .eq('id', id)
            .single();
            
        if (checkError || !existing) return res.status(404).json({ success: false, error: 'Not found' });
        if (['processing', 'sent'].includes(existing.status)) {
            return res.status(400).json({ success: false, error: 'Cannot modify a processing or sent broadcast' });
        }
        
        const { data, error } = await supabase
            .from('broadcasts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        logger.error('Error updating broadcast', { error: error.message });
        res.status(500).json({ success: false, error: 'Database error' });
    }
};

// Delete a broadcast draft
exports.deleteBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('broadcasts')
            .delete()
            .eq('id', id)
            .eq('status', 'draft'); // Only delete drafts for safety
            
        if (error) throw error;
        res.json({ success: true, message: 'Broadcast draft deleted' });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Send a test broadcast
exports.sendTestBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Test email address is required' });
        }
        
        const { data: broadcast, error: checkError } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('id', id)
            .single();
            
        if (checkError || !broadcast) return res.status(404).json({ success: false, error: 'Broadcast not found' });
        
        // Using email service to send a test email
        if(emailService && typeof emailService.sendEmail === 'function') {
           await emailService.sendEmail(email, `[TEST] ${broadcast.subject}`, broadcast.message);
        } else {
           // fallback / mock if service is not injected perfectly
           logger.info(`Mocking test email to ${email} for broadcast: ${broadcast.subject}`);
        }

        res.json({ success: true, message: 'Test broadcast sent successfully' });
    } catch(err) {
        logger.error('Error sending test broadcast', { error: err.message });
        res.status(500).json({ success: false, error: err.message });
    }
};

// Support fetching analytics
exports.getAnalytics = async (req, res) => {
    try {
        const { data: broadcasts, error } = await supabase
            .from('broadcasts')
            .select('id, sent_count, open_count, click_count, recipient_group, status')
            .in('status', ['sent', 'processing']);

        if (error) throw error;

        let totalMessages = 0;
        let totalOpens = 0;
        let totalClicks = 0;
        
        broadcasts?.forEach(b => {
             totalMessages += b.sent_count || 0;
             totalOpens += b.open_count || 0;
             totalClicks += b.click_count || 0;
        });

        const openRate = totalMessages > 0 ? ((totalOpens / totalMessages) * 100).toFixed(1) : 0;
        const clickRate = totalMessages > 0 ? ((totalClicks / totalMessages) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                totalMessages,
                openRate: Number(openRate),
                clickRate: Number(clickRate),
                engagementScore: Number(openRate) * 0.6 + Number(clickRate) * 0.4,
                bestSendingTimes: ['09:00 AM', '02:00 PM'],
                topPerformingCategories: ['Update', 'Feature Release']
            }
        });
    } catch(err) {
        logger.error('Error fetching broadcast analytics', { error: err.message });
        res.status(500).json({ success: false, error: err.message });
    }
};

// Immediately Send a broadcast
exports.sendBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Mark as processing
        const { data: broadcast, error: updateError } = await supabase
            .from('broadcasts')
            .update({ status: 'processing', sent_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
            
        if (updateError) throw updateError;
        
        // 2. Here would be the actual email sending logic (e.g. queueing jobs)
        // emailService.queueBroadcast(broadcast);
        
        // For demonstration, mark as sent immediately
        const { error: finalUpdate } = await supabase
            .from('broadcasts')
            .update({ 
               status: 'sent',
               sent_count: 0 // Update this via webhook callback or job
            })
            .eq('id', id);

        res.json({ success: true, message: 'Broadcast is processing', data: broadcast });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};