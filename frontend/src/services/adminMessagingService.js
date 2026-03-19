const API_BASE = '/api/admin';

/**
 * Fetch users with pagination and filtering
 */
export async function fetchUsers(options = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    isActive = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role }),
    ...(isActive !== '' && { isActive }),
    sortBy,
    sortOrder
  });

  try {
    const response = await fetch(`${API_BASE}/users?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

/**
 * Send email to user(s)
 */
export async function sendEmail({ userId, emails, subject, message, type = 'admin_message' }) {
  try {
    const response = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        emails,
        subject,
        message,
        type
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Get email logs with pagination
 */
export async function getEmailLogs(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = '',
    type = ''
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(type && { type })
  });

  try {
    const response = await fetch(`${API_BASE}/email-logs?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    throw error;
  }
}

/**
 * Get bulk email details
 */
export async function getBulkEmailDetails(bulkId) {
  try {
    const response = await fetch(`${API_BASE}/bulk-email/${bulkId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch bulk email details:', error);
    throw error;
  }
}

/**
 * Get email statistics
 */
export async function getEmailStatistics() {
  try {
    const response = await fetch(`${API_BASE}/email-stats`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch email statistics:', error);
    throw error;
  }
}

/**
 * Test email configuration
 */
export async function testEmail() {
  try {
    const response = await fetch(`${API_BASE}/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to test email:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
