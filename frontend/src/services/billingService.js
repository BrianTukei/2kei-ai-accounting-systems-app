const API_BASE = '/api/billing';

/**
 * Get available pricing plans
 */
export async function getPricingPlans() {
  try {
    const response = await fetch(`${API_BASE}/plans`, {
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
    console.error('Failed to get pricing plans:', error);
    throw error;
  }
}

/**
 * Calculate subscription cost
 */
export async function calculateSubscriptionCost(plan, billingCycle = 'monthly', discountCode = '') {
  try {
    const response = await fetch(`${API_BASE}/calculate-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        plan,
        billingCycle,
        discountCode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to calculate cost:', error);
    throw error;
  }
}

/**
 * Create subscription
 */
export async function createSubscription(plan, billingCycle = 'monthly') {
  try {
    const response = await fetch(`${API_BASE}/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        plan,
        billingCycle
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(newPlan, billingCycle = 'monthly') {
  try {
    const response = await fetch(`${API_BASE}/subscription/upgrade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        newPlan,
        billingCycle
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to upgrade subscription:', error);
    throw error;
  }
}

/**
 * Downgrade subscription
 */
export async function downgradeSubscription(newPlan, effectiveDate = null) {
  try {
    const response = await fetch(`${API_BASE}/subscription/downgrade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        newPlan,
        effectiveDate
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to downgrade subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(reason = '') {
  try {
    const response = await fetch(`${API_BASE}/subscription`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
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
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus() {
  try {
    const response = await fetch(`${API_BASE}/subscription/status`, {
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
    console.error('Failed to get subscription status:', error);
    throw error;
  }
}

/**
 * Check usage limits
 */
export async function checkUsageLimit(feature, currentUsage = null) {
  try {
    const response = await fetch(`${API_BASE}/usage/check/${feature}`, {
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
    console.error('Failed to check usage limit:', error);
    throw error;
  }
}

/**
 * Track usage
 */
export async function trackUsage(feature, increment = 1) {
  try {
    const response = await fetch(`${API_BASE}/usage/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        feature,
        increment
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to track usage:', error);
    throw error;
  }
}

/**
 * Purchase AI credits
 */
export async function purchaseAICredits(credits, paymentMethod, paymentDetails) {
  try {
    const response = await fetch(`${API_BASE}/ai-credits/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        credits,
        paymentMethod,
        paymentDetails
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to purchase AI credits:', error);
    throw error;
  }
}

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(period = 'month') {
  try {
    const response = await fetch(`${API_BASE}/ai-credits/stats?period=${period}`, {
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
    console.error('Failed to get AI usage stats:', error);
    throw error;
  }
}

/**
 * Get billing history
 */
export async function getBillingHistory(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = '',
    dateFrom = '',
    dateTo = ''
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo })
  });

  try {
    const response = await fetch(`${API_BASE}/history?${params}`, {
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
    console.error('Failed to get billing history:', error);
    throw error;
  }
}

/**
 * Get supported payment methods
 */
export async function getPaymentMethods() {
  try {
    const response = await fetch(`${API_BASE}/payment/methods`, {
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
    console.error('Failed to get payment methods:', error);
    throw error;
  }
}

/**
 * Process payment
 */
export async function processPayment(paymentData) {
  try {
    const response = await fetch(`${API_BASE}/payment/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to process payment:', error);
    throw error;
  }
}

/**
 * Format UGX currency
 */
export function formatUGX(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Validate phone number (Uganda)
 */
export function validateUgandanPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^(2567\d{8}|07\d{8})$/.test(cleanPhone);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('256')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('07')) {
    return `256${cleanPhone.substring(1)}`;
  }
  return cleanPhone;
}

/**
 * Get plan features
 */
export function getPlanFeatures(plan) {
  const features = {
    FREE: {
      maxTransactions: 50,
      maxUsers: 1,
      maxReports: 10,
      aiFeatures: false,
      mobileMoneyTracking: false,
      advancedAnalytics: false,
      crmIntegration: false,
      customDashboards: false,
      prioritySupport: false,
      emailSupport: false,
      phoneSupport: false,
      dedicatedManager: false,
      aiCredits: 0
    },
    STARTER: {
      maxTransactions: -1, // unlimited
      maxUsers: 1,
      maxReports: 25,
      aiFeatures: false,
      mobileMoneyTracking: true,
      advancedAnalytics: false,
      crmIntegration: false,
      customDashboards: false,
      prioritySupport: false,
      emailSupport: true,
      phoneSupport: false,
      dedicatedManager: false,
      aiCredits: 10
    },
    BUSINESS: {
      maxTransactions: -1,
      maxUsers: 5,
      maxReports: -1,
      aiFeatures: true,
      mobileMoneyTracking: true,
      advancedAnalytics: true,
      crmIntegration: false,
      customDashboards: false,
      prioritySupport: true,
      emailSupport: true,
      phoneSupport: true,
      dedicatedManager: false,
      aiCredits: 100
    },
    ENTERPRISE: {
      maxTransactions: -1,
      maxUsers: -1,
      maxReports: -1,
      aiFeatures: true,
      mobileMoneyTracking: true,
      advancedAnalytics: true,
      crmIntegration: true,
      customDashboards: true,
      prioritySupport: true,
      emailSupport: true,
      phoneSupport: true,
      dedicatedManager: true,
      aiCredits: -1 // unlimited
    }
  };

  return features[plan] || features.FREE;
}

/**
 * Check if user can access feature
 */
export function canAccessFeature(userPlan, feature) {
  const features = getPlanFeatures(userPlan);
  return features[feature] || false;
}

/**
 * Get upgrade path
 */
export function getUpgradePath(currentPlan) {
  const upgradePaths = {
    FREE: ['STARTER', 'BUSINESS', 'ENTERPRISE'],
    STARTER: ['BUSINESS', 'ENTERPRISE'],
    BUSINESS: ['ENTERPRISE'],
    ENTERPRISE: []
  };

  return upgradePaths[currentPlan] || [];
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(monthlyPrice, yearlyPrice) {
  const yearlyMonthlyCost = monthlyPrice * 12;
  const savings = yearlyMonthlyCost - yearlyPrice;
  const savingsPercentage = (savings / yearlyMonthlyCost) * 100;
  
  return {
    amount: savings,
    percentage: Math.round(savingsPercentage)
  };
}
