const API_BASE = '/api/billing';

/**
 * Process payment for subscription or credits
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
 * Validate phone number for mobile money
 */
export function validatePhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Uganda phone number validation
  if (!/^(2567\d{8}|07\d{8})$/.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Please enter a valid Ugandan phone number (e.g., 07XX XXX XXX or 256 7XX XXX XXX)'
    };
  }

  return {
    valid: true,
    normalizedNumber: cleanPhone.startsWith('256') ? cleanPhone : `256${cleanPhone.substring(1)}`
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('256')) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleanPhone.startsWith('07')) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
}

/**
 * Detect mobile money provider
 */
export function detectProvider(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  const normalizedPhone = cleanPhone.startsWith('256') ? cleanPhone : cleanPhone.startsWith('07') ? `256${cleanPhone.substring(1)}` : cleanPhone;
  
  // MTN Uganda numbers: 2567[0-2] or 2567[8-9]
  if (normalizedPhone.startsWith('25670') || normalizedPhone.startsWith('25671') || 
      normalizedPhone.startsWith('25678') || normalizedPhone.startsWith('25679')) {
    return 'mtn_momo';
  }
  
  // Airtel Uganda numbers: 2567[5-7]
  if (normalizedPhone.startsWith('25675') || normalizedPhone.startsWith('25676') || 
      normalizedPhone.startsWith('25677')) {
    return 'airtel_money';
  }
  
  return 'unknown';
}

/**
 * Get provider display name
 */
export function getProviderName(provider) {
  const names = {
    mtn_momo: 'MTN Mobile Money',
    airtel_money: 'Airtel Money',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    unknown: 'Unknown Provider'
  };
  
  return names[provider] || names.unknown;
}

/**
 * Get provider color
 */
export function getProviderColor(provider) {
  const colors = {
    mtn_momo: '#FFD700', // MTN yellow
    airtel_money: '#FF0000', // Airtel red
    card: '#3B82F6', // Blue
    bank_transfer: '#10B981', // Green
    unknown: '#6B7280' // Gray
  };
  
  return colors[provider] || colors.unknown;
}

/**
 * Generate payment reference
 */
export function generatePaymentReference(prefix = 'PAY') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Calculate transaction fee
 */
export function calculateTransactionFee(amount, feePercentage = 0, fixedFee = 0) {
  const feeAmount = (amount * feePercentage) + fixedFee;
  const netAmount = amount - feeAmount;
  
  return {
    grossAmount: amount,
    feePercentage,
    fixedFee,
    feeAmount,
    netAmount
  };
}

/**
 * Format amount for display
 */
export function formatAmount(amount, currency = 'UGX') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(reference) {
  try {
    const response = await fetch(`${API_BASE}/payment/status/${reference}`, {
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
    console.error('Failed to check payment status:', error);
    throw error;
  }
}

/**
 * Retry failed payment
 */
export async function retryPayment(reference) {
  try {
    const response = await fetch(`${API_BASE}/payment/retry/${reference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to retry payment:', error);
    throw error;
  }
}

/**
 * Cancel payment
 */
export async function cancelPayment(reference) {
  try {
    const response = await fetch(`${API_BASE}/payment/cancel/${reference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to cancel payment:', error);
    throw error;
  }
}

/**
 * Get payment limits
 */
export function getPaymentLimits(paymentMethod) {
  const limits = {
    mtn_momo: {
      minAmount: 500,
      maxAmount: 5000000,
      dailyLimit: 10000000,
      transactionLimit: 2000000
    },
    airtel_money: {
      minAmount: 500,
      maxAmount: 5000000,
      dailyLimit: 10000000,
      transactionLimit: 2000000
    },
    card: {
      minAmount: 1000,
      maxAmount: 10000000,
      dailyLimit: 20000000,
      transactionLimit: 5000000
    },
    bank_transfer: {
      minAmount: 10000,
      maxAmount: 50000000,
      dailyLimit: 100000000,
      transactionLimit: 10000000
    }
  };
  
  return limits[paymentMethod] || limits.card;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount, paymentMethod) {
  const limits = getPaymentLimits(paymentMethod);
  
  if (amount < limits.minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ${formatAmount(limits.minAmount)}`
    };
  }
  
  if (amount > limits.maxAmount) {
    return {
      valid: false,
      error: `Maximum amount is ${formatAmount(limits.maxAmount)}`
    };
  }
  
  return {
    valid: true,
    limits
  };
}

/**
 * Get payment processing time
 */
export function getProcessingTime(paymentMethod) {
  const times = {
    mtn_momo: '1-3 minutes',
    airtel_money: '1-3 minutes',
    card: '2-5 minutes',
    bank_transfer: '1-3 business days'
  };
  
  return times[paymentMethod] || 'Unknown';
}

/**
 * Get payment success rate
 */
export function getSuccessRate(paymentMethod) {
  const rates = {
    mtn_momo: 95.5,
    airtel_money: 93.2,
    card: 97.8,
    bank_transfer: 99.1
  };
  
  return rates[paymentMethod] || 0;
}

/**
 * Format payment description
 */
export function formatPaymentDescription(type, plan, billingCycle) {
  switch (type) {
    case 'subscription_payment':
      return `${plan} subscription (${billingCycle})`;
    case 'ai_credit_purchase':
      return 'AI credits purchase';
    case 'transaction_fee':
      return 'Transaction fee';
    case 'upgrade_payment':
      return `Plan upgrade to ${plan}`;
    default:
      return 'Payment';
  }
}

/**
 * Get payment status color
 */
export function getStatusColor(status) {
  const colors = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    cancelled: '#6B7280',
    refunded: '#8B5CF6'
  };
  
  return colors[status] || '#6B7280';
}

/**
 * Get payment status icon
 */
export function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    processing: '⚙️',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
    refunded: '💰'
  };
  
  return icons[status] || '❓';
}
