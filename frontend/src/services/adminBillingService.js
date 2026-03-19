const API_BASE = '/api/admin/billing';

/**
 * Get billing analytics and statistics
 */
export async function getBillingStats(filters = {}) {
  const { dateFrom, dateTo } = filters;
  const params = new URLSearchParams();
  
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  try {
    const response = await fetch(`${API_BASE}/stats?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get billing stats:', error);
    throw error;
  }
}

/**
 * Get all subscriptions with filtering
 */
export async function getSubscriptions(filters = {}) {
  const {
    page = 1,
    limit = 20,
    status = '',
    plan = '',
    dateFrom = '',
    dateTo = '',
    search = ''
  } = filters;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(plan && { plan }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(search && { search })
  });

  try {
    const response = await fetch(`${API_BASE}/subscriptions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get subscriptions:', error);
    throw error;
  }
}

/**
 * Get all transactions with filtering
 */
export async function getTransactions(filters = {}) {
  const {
    page = 1,
    limit = 20,
    status = '',
    type = '',
    paymentMethod = '',
    dateFrom = '',
    dateTo = '',
    search = ''
  } = filters;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(type && { type }),
    ...(paymentMethod && { paymentMethod }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(search && { search })
  });

  try {
    const response = await fetch(`${API_BASE}/transactions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
}

/**
 * Update user subscription (admin override)
 */
export async function updateUserSubscription(userId, updateData) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}

/**
 * Get detailed user billing information
 */
export async function getUserBillingDetails(userId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/billing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get user billing details:', error);
    throw error;
  }
}

/**
 * Add AI credits to user (admin)
 */
export async function addAICredits(userId, credits, reason = '') {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/ai-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        credits,
        reason
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to add AI credits:', error);
    throw error;
  }
}

/**
 * Get revenue by payment method
 */
export async function getRevenueByPaymentMethod(filters = {}) {
  const { dateFrom, dateTo } = filters;
  const params = new URLSearchParams();
  
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  try {
    const response = await fetch(`${API_BASE}/revenue/payment-methods?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get revenue by payment method:', error);
    throw error;
  }
}

/**
 * Export billing data
 */
export async function exportBillingData(filters = {}) {
  const { format = 'json', dateFrom, dateTo } = filters;
  const params = new URLSearchParams({
    format,
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo })
  });

  try {
    const response = await fetch(`${API_BASE}/export?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (format === 'csv') {
      // Handle CSV download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `billing-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Failed to export billing data:', error);
    throw error;
  }
}

/**
 * Process expiring subscriptions (admin task)
 */
export async function processExpiringSubscriptions() {
  try {
    const response = await fetch(`${API_BASE}/process-expiring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to process expiring subscriptions:', error);
    throw error;
  }
}

/**
 * Get subscription growth metrics
 */
export async function getSubscriptionGrowth(period = 'month') {
  try {
    const response = await fetch(`${API_BASE}/stats?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get subscription growth:', error);
    throw error;
  }
}

/**
 * Get churn analysis
 */
export async function getChurnAnalysis(period = 'month') {
  try {
    const response = await fetch(`${API_BASE}/stats?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get churn analysis:', error);
    throw error;
  }
}

/**
 * Get top paying customers
 */
export async function getTopPayingCustomers(limit = 10, period = 'month') {
  try {
    const response = await fetch(`${API_BASE}/stats?limit=${limit}&period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get top paying customers:', error);
    throw error;
  }
}

/**
 * Get revenue forecast
 */
export async function getRevenueForecast(months = 6) {
  try {
    const response = await fetch(`${API_BASE}/stats?forecast=${months}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get revenue forecast:', error);
    throw error;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'UGX') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get plan color for charts
 */
export function getPlanColor(plan) {
  const colors = {
    FREE: '#6B7280',
    STARTER: '#3B82F6',
    BUSINESS: '#8B5CF6',
    ENTERPRISE: '#F97316'
  };
  return colors[plan] || '#6B7280';
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(method) {
  const icons = {
    mtn_momo: '🟡',
    airtel_money: '🔴',
    card: '💳',
    bank_transfer: '🏦',
    cash: '💵'
  };
  return icons[method] || '💳';
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

/**
 * Get status color
 */
export function getStatusColor(status) {
  const colors = {
    active: '#10B981',
    inactive: '#6B7280',
    cancelled: '#EF4444',
    expired: '#F97316',
    suspended: '#F59E0B',
    pending: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    refunded: '#8B5CF6'
  };
  return colors[status] || '#6B7280';
}
