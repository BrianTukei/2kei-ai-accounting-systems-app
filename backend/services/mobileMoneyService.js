const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class MobileMoneyService {
  constructor() {
    // MTN MoMo API Configuration
    this.mtnConfig = {
      baseUrl: process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
      apiKey: process.env.MTN_MOMO_API_KEY,
      apiSecret: process.env.MTN_MOMO_API_SECRET,
      userId: process.env.MTN_MOMO_USER_ID,
      primaryKey: process.env.MTN_MOMO_PRIMARY_KEY,
      callbackUrl: process.env.MTN_MOMO_CALLBACK_URL,
      currency: 'UGX',
      environment: process.env.NODE_ENV || 'sandbox'
    };

    // Airtel Money API Configuration
    this.airtelConfig = {
      baseUrl: process.env.AIRTEL_MONEY_BASE_URL || 'https://openapi.airtel.africa',
      clientId: process.env.AIRTEL_MONEY_CLIENT_ID,
      clientSecret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
      country: 'UG',
      currency: 'UGX',
      environment: process.env.NODE_ENV || 'sandbox'
    };

    // Flutterwave Configuration (as fallback)
    this.flutterwaveConfig = {
      baseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      environment: process.env.NODE_ENV || 'sandbox'
    };
  }

  /**
   * Initialize MTN MoMo API
   */
  async initializeMTNMoMo() {
    try {
      const response = await axios.post(
        `${this.mtnConfig.baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials'
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.mtnConfig.apiKey}:${this.mtnConfig.apiSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.mtnConfig.apiKey
          }
        }
      );

      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('MTN MoMo initialization failed:', error);
      return {
        success: false,
        error: 'Failed to initialize MTN MoMo API'
      };
    }
  }

  /**
   * Initialize Airtel Money API
   */
  async initializeAirtelMoney() {
    try {
      const response = await axios.post(
        `${this.airtelConfig.baseUrl}/auth/oauth2/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.airtelConfig.clientId,
          client_secret: this.airtelConfig.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      logger.error('Airtel Money initialization failed:', error);
      return {
        success: false,
        error: 'Failed to initialize Airtel Money API'
      };
    }
  }

  /**
   * Send money via MTN MoMo
   */
  async sendMoneyMTN(phoneNumber, amount, reference, callbackUrl = null) {
    try {
      // Get access token
      const authResult = await this.initializeMTNMoMo();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      const token = authResult.accessToken;

      // Create request to pay
      const requestToPayResponse = await axios.post(
        `${this.mtnConfig.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: amount.toString(),
          currency: this.mtnConfig.currency,
          externalId: reference,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phoneNumber
          },
          payerMessage: `Payment for ${reference}`,
          payeeNote: '2K AI Accounting System',
          callbackUrl: callbackUrl || this.mtnConfig.callbackUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Reference-Id': reference,
            'X-Target-Environment': this.mtnConfig.environment,
            'Ocp-Apim-Subscription-Key': this.mtnConfig.apiKey
          }
        }
      );

      return {
        success: true,
        reference: requestToPayResponse.data.referenceId,
        status: 'pending',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      logger.error('MTN MoMo send money failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send money via MTN MoMo'
      };
    }
  }

  /**
   * Send money via Airtel Money
   */
  async sendMoneyAirtel(phoneNumber, amount, reference, callbackUrl = null) {
    try {
      // Get access token
      const authResult = await this.initializeAirtelMoney();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      const token = authResult.accessToken;

      // Create transaction
      const response = await axios.post(
        `${this.airtelConfig.baseUrl}/merchant/v1/payment`,
        {
          reference: reference,
          amount: amount.toString(),
          phone: phoneNumber,
          country: this.airtelConfig.country,
          currency: this.airtelConfig.currency,
          customer: {
            email: 'customer@2kei.com',
            name: '2K AI Accounting Customer'
          },
          transaction: {
            description: `Payment for ${reference}`,
            id: reference
          },
          callback: callbackUrl || `${process.env.BASE_URL}/api/payments/airtel/callback`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': this.airtelConfig.country,
            'X-Currency': this.airtelConfig.currency
          }
        }
      );

      return {
        success: true,
        reference: response.data.transaction.id,
        status: 'pending',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      logger.error('Airtel Money send money failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send money via Airtel Money'
      };
    }
  }

  /**
   * Send money via Flutterwave (fallback)
   */
  async sendMoneyFlutterwave(phoneNumber, amount, reference, network) {
    try {
      // Encrypt payment details
      const encryptedData = this.encryptPaymentData({
        phone_number: phoneNumber,
        amount: amount,
        currency: 'UGX',
        email: 'customer@2kei.com',
        tx_ref: reference,
        network: network, // 'mtn' or 'airtel'
      });

      const response = await axios.post(
        `${this.flutterwaveConfig.baseUrl}/charges`,
        {
          tx_ref: reference,
          amount: amount,
          currency: 'UGX',
          email: 'customer@2kei.com',
          phone_number: phoneNumber,
          payment_type: 'mobile_money_uganda',
          network: network,
          encrypted_data: encryptedData,
          meta: {
            source: '2K AI Accounting System',
            reference: reference
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveConfig.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        reference: response.data.data.id,
        status: response.data.data.status,
        message: 'Payment initiated successfully via Flutterwave'
      };
    } catch (error) {
      logger.error('Flutterwave send money failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send money via Flutterwave'
      };
    }
  }

  /**
   * Check MTN MoMo transaction status
   */
  async checkMTNTransactionStatus(reference) {
    try {
      const authResult = await this.initializeMTNMoMo();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      const token = authResult.accessToken;

      const response = await axios.get(
        `${this.mtnConfig.baseUrl}/collection/v1_0/requesttopay/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Target-Environment': this.mtnConfig.environment,
            'Ocp-Apim-Subscription-Key': this.mtnConfig.apiKey
          }
        }
      );

      const status = response.data.status;
      const mappedStatus = this.mapMTNStatus(status);

      return {
        success: true,
        status: mappedStatus,
        data: response.data
      };
    } catch (error) {
      logger.error('MTN MoMo status check failed:', error);
      return {
        success: false,
        error: 'Failed to check transaction status'
      };
    }
  }

  /**
   * Check Airtel Money transaction status
   */
  async checkAirtelTransactionStatus(reference) {
    try {
      const authResult = await this.initializeAirtelMoney();
      if (!authResult.success) {
        throw new Error('Authentication failed');
      }

      const token = authResult.accessToken;

      const response = await axios.get(
        `${this.airtelConfig.baseUrl}/merchant/v1/payment/query/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': this.airtelConfig.country,
            'X-Currency': this.airtelConfig.currency
          }
        }
      );

      const status = response.data.transaction.status;
      const mappedStatus = this.mapAirtelStatus(status);

      return {
        success: true,
        status: mappedStatus,
        data: response.data
      };
    } catch (error) {
      logger.error('Airtel Money status check failed:', error);
      return {
        success: false,
        error: 'Failed to check transaction status'
      };
    }
  }

  /**
   * Process payment with automatic provider selection
   */
  async processPayment(phoneNumber, amount, reference, preferredProvider = null) {
    const results = [];
    
    // Determine provider based on phone number or preference
    const provider = preferredProvider || this.detectProvider(phoneNumber);
    
    try {
      let result;
      
      switch (provider) {
        case 'mtn_momo':
          result = await this.sendMoneyMTN(phoneNumber, amount, reference);
          break;
        case 'airtel_money':
          result = await this.sendMoneyAirtel(phoneNumber, amount, reference);
          break;
        default:
          // Try Flutterwave as fallback
          result = await this.sendMoneyFlutterwave(phoneNumber, amount, reference, provider);
      }
      
      results.push(result);
      
      // If primary provider fails, try fallback
      if (!result.success && provider !== 'flutterwave') {
        logger.warn(`Primary provider ${provider} failed, trying Flutterwave fallback`);
        const fallbackResult = await this.sendMoneyFlutterwave(phoneNumber, amount, reference, provider);
        results.push(fallbackResult);
      }
      
      return results;
    } catch (error) {
      logger.error('Payment processing failed:', error);
      return [{
        success: false,
        error: 'Payment processing failed',
        provider: provider
      }];
    }
  }

  /**
   * Detect mobile money provider from phone number
   */
  detectProvider(phoneNumber) {
    // Remove any formatting characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Uganda phone numbers start with 256 or 0
    const normalizedPhone = cleanPhone.startsWith('256') ? cleanPhone : cleanPhone.startsWith('0') ? `256${cleanPhone.substring(1)}` : cleanPhone;
    
    // MTN Uganda numbers: 2567[0-2] or 2567[8-9]
    if (normalizedPhone.startsWith('25670') || normalizedPhone.startsWith('25671') || normalizedPhone.startsWith('25678') || normalizedPhone.startsWith('25679')) {
      return 'mtn_momo';
    }
    
    // Airtel Uganda numbers: 2567[5-7]
    if (normalizedPhone.startsWith('25675') || normalizedPhone.startsWith('25676') || normalizedPhone.startsWith('25677')) {
      return 'airtel_money';
    }
    
    // Default to Flutterwave for unknown numbers
    return 'flutterwave';
  }

  /**
   * Map MTN status to standard status
   */
  mapMTNStatus(status) {
    const statusMap = {
      'PENDING': 'pending',
      'SUCCESSFUL': 'completed',
      'FAILED': 'failed',
      'TIMEOUT': 'failed',
      'REJECTED': 'cancelled'
    };
    
    return statusMap[status] || 'pending';
  }

  /**
   * Map Airtel status to standard status
   */
  mapAirtelStatus(status) {
    const statusMap = {
      'PENDING': 'pending',
      'SUCCESS': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'TIMEOUT': 'failed'
    };
    
    return statusMap[status] || 'pending';
  }

  /**
   * Encrypt payment data for Flutterwave
   */
  encryptPaymentData(data) {
    try {
      const key = this.flutterwaveConfig.encryptionKey;
      const algorithm = 'aes-256-cbc';
      
      // Generate a random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAutoPadding(true);
      
      // Encrypt the data
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data
      return iv.toString('hex') + encrypted;
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Validate phone number for Uganda
   */
  validatePhoneNumber(phoneNumber) {
    // Remove any formatting characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check length
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      return {
        valid: false,
        error: 'Invalid phone number length'
      };
    }
    
    // Check Uganda prefix
    const normalizedPhone = cleanPhone.startsWith('256') ? cleanPhone : cleanPhone.startsWith('0') ? `256${cleanPhone.substring(1)}` : cleanPhone;
    
    if (!normalizedPhone.startsWith('2567')) {
      return {
        valid: false,
        error: 'Invalid Uganda phone number'
      };
    }
    
    return {
      valid: true,
      normalizedNumber: normalizedPhone,
      provider: this.detectProvider(normalizedPhone)
    };
  }

  /**
   * Format amount for display
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Generate unique transaction reference
   */
  generateReference(prefix = '2KEI') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Handle webhook callback
   */
  async handleWebhook(provider, data) {
    try {
      switch (provider) {
        case 'mtn_momo':
          return this.handleMTNWebhook(data);
        case 'airtel_money':
          return this.handleAirtelWebhook(data);
        case 'flutterwave':
          return this.handleFlutterwaveWebhook(data);
        default:
          throw new Error('Unknown provider');
      }
    } catch (error) {
      logger.error(`Webhook handling failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Handle MTN MoMo webhook
   */
  handleMTNWebhook(data) {
    const status = this.mapMTNStatus(data.status);
    
    return {
      provider: 'mtn_momo',
      reference: data.referenceId,
      status,
      amount: data.amount,
      currency: data.currency,
      phoneNumber: data.payer.partyId,
      timestamp: new Date(),
      raw: data
    };
  }

  /**
   * Handle Airtel Money webhook
   */
  handleAirtelWebhook(data) {
    const status = this.mapAirtelStatus(data.transaction.status);
    
    return {
      provider: 'airtel_money',
      reference: data.transaction.id,
      status,
      amount: data.transaction.amount,
      currency: data.transaction.currency,
      phoneNumber: data.transaction.phone,
      timestamp: new Date(),
      raw: data
    };
  }

  /**
   * Handle Flutterwave webhook
   */
  handleFlutterwaveWebhook(data) {
    const status = data.status === 'successful' ? 'completed' : data.status === 'failed' ? 'failed' : 'pending';
    
    return {
      provider: 'flutterwave',
      reference: data.id,
      status,
      amount: data.amount,
      currency: data.currency,
      phoneNumber: data.customer.phone_number,
      timestamp: new Date(),
      raw: data
    };
  }

  /**
   * Get supported providers
   */
  getSupportedProviders() {
    return [
      {
        name: 'MTN Mobile Money',
        code: 'mtn_momo',
        logo: '/assets/mtn-logo.png',
        description: 'Uganda\'s largest mobile money provider',
        supported: true
      },
      {
        name: 'Airtel Money',
        code: 'airtel_money',
        logo: '/assets/airtel-logo.png',
        description: 'Fast and reliable mobile money service',
        supported: true
      },
      {
        name: 'Flutterwave',
        code: 'flutterwave',
        logo: '/assets/flutterwave-logo.png',
        description: 'Universal payment gateway (fallback)',
        supported: true
      }
    ];
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(dateFrom, dateTo) {
    // This would typically query your transaction database
    // For now, return mock data
    return {
      mtn_momo: {
        totalTransactions: 150,
        totalAmount: 7500000,
        successRate: 95.5,
        averageProcessingTime: 45000 // 45 seconds
      },
      airtel_money: {
        totalTransactions: 120,
        totalAmount: 6000000,
        successRate: 93.2,
        averageProcessingTime: 38000 // 38 seconds
      },
      flutterwave: {
        totalTransactions: 30,
        totalAmount: 1500000,
        successRate: 97.8,
        averageProcessingTime: 55000 // 55 seconds
      }
    };
  }
}

module.exports = new MobileMoneyService();
