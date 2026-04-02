/**
 * Admin Messaging System
 * Allows admins to send messages to users
 */

const express = require('express');
const { auth, admin } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const router = express.Router();

// ─────────────────────────────────────────
// SEND MESSAGE TO USER/USERS
// ─────────────────────────────────────────

/**
 * Send message to specific user(s)
 * POST /api/admin/messages/send
 * Body: { userIds?: string[], recipientType: 'all'|'paid'|'free'|'specific', title, message, link? }
 */
router.post('/send', admin, async (req, res) => {
  try {
    const { userIds, recipientType, title, message, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    if (!['all', 'paid', 'free', 'specific'].includes(recipientType)) {
      return res.status(400).json({ error: 'Invalid recipient type' });
    }

    if (recipientType === 'specific' && (!userIds || userIds.length === 0)) {
      return res.status(400).json({ error: 'userIds required for specific recipient type' });
    }

    let targetUsers = [];

    // Determine target users based on recipient type
    if (recipientType === 'specific') {
      targetUsers = userIds;
    } else if (recipientType === 'all') {
      // Get all users
      const { data: users, error } = await supabase
        .from('auth.users')
        .select('id');

      if (error) throw error;
      targetUsers = users?.map(u => u.id) || [];
    } else if (recipientType === 'paid') {
      // Get all users with active paid subscriptions
      const { data: users, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .not('plan_id', 'eq', 'free');

      if (error) throw error;
      targetUsers = [...new Set(users?.map(s => s.user_id) || [])];
    } else if (recipientType === 'free') {
      // Get all users on free plan
      const { data: users, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('plan_id', 'free');

      if (error) throw error;
      targetUsers = [...new Set(users?.map(s => s.user_id) || [])];
    }

    // Create messages for each target user
    const messagesToInsert = targetUsers.map(userId => ({
      user_id: userId,
      title,
      message,
      link: link || null,
      status: 'active',
      created_by: req.user.id,
    }));

    const { data: insertedMessages, error: insertError } = await supabase
      .from('admin_messages')
      .insert(messagesToInsert)
      .select();

    if (insertError) throw insertError;

    logger.info(`Admin message sent to ${targetUsers.length} users`, {
      recipientType,
      count: targetUsers.length,
      adminId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: `Message sent to ${targetUsers.length} users`,
      sentCount: targetUsers.length,
      data: insertedMessages,
    });
  } catch (error) {
    logger.error('Error sending admin message', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// GET ALL MESSAGES (ADMIN)
// ─────────────────────────────────────────

/**
 * Get all sent messages
 * GET /api/admin/messages
 */
router.get('/', admin, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('admin_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: messages?.length || 0,
      data: messages || [],
    });
  } catch (error) {
    logger.error('Error fetching admin messages', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// DISMISS MESSAGE (USER)
// ─────────────────────────────────────────

/**
 * User dismisses/reads a message
 * PATCH /api/messages/:messageId/dismiss
 */
router.patch('/:messageId/dismiss', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user } = req;

    // Verify user owns this message
    const { data: message, error: fetchError } = await supabase
      .from('admin_messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as dismissed
    const { error: updateError } = await supabase
      .from('admin_messages')
      .update({ status: 'dismissed' })
      .eq('id', messageId);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Message dismissed' });
  } catch (error) {
    logger.error('Error dismissing message', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// GET USER'S ACTIVE MESSAGES
// ─────────────────────────────────────────

/**
 * Get user's active messages
 * GET /api/messages/active
 */
router.get('/user/active', auth, async (req, res) => {
  try {
    const { user } = req;

    const { data: messages, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: messages?.length || 0,
      data: messages || [],
    });
  } catch (error) {
    logger.error('Error fetching user messages', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
