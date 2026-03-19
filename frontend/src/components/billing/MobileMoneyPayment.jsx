import React, { useState } from 'react';
import { X, Phone, CreditCard, Shield, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { processPayment } from '../../services/paymentService';

export default function MobileMoneyPayment({ plan, pricing, billingCycle, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verified, setVerified] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const validatePhoneNumber = (phone) => {
    // Uganda phone number validation
    const cleanPhone = phone.replace(/\D/g, '');
    return /^(2567\d{8}|07\d{8})$/.test(cleanPhone);
  };

  const formatPhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('256')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('07')) {
      return `256${cleanPhone.substring(1)}`;
    }
    return cleanPhone;
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setStep(2);
  };

  const handlePhoneNumberSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Ugandan phone number');
      return;
    }

    setStep(3);
  };

  const handlePaymentSubmit = async () => {
    try {
      setProcessing(true);
      setError('');

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const paymentData = {
        plan: plan.name,
        billingCycle,
        amount: pricing.price,
        paymentMethod,
        phoneNumber: formattedPhone,
        currency: 'UGX'
      };

      const response = await processPayment(paymentData);

      if (response.success) {
        setTransaction(response.data);
        setStep(4);
      } else {
        setError(response.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setProcessing(true);
      
      // In a real implementation, this would verify the code with the payment provider
      // For now, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerified(true);
      setStep(5);
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPaymentMethod('mtn_momo');
    setPhoneNumber('');
    setError('');
    setTransaction(null);
    setVerificationCode('');
    setVerified(false);
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Payment Method</h3>
        <p className="text-gray-600">Select your preferred payment method</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handlePaymentMethodSelect('mtn_momo')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MTN</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">MTN Mobile Money</p>
              <p className="text-sm text-gray-600">Fast and secure payments</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
        </button>

        <button
          onClick={() => handlePaymentMethodSelect('airtel_money')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AIRTEL</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Airtel Money</p>
              <p className="text-sm text-gray-600">Quick and reliable payments</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
        </button>

        <button
          onClick={() => handlePaymentMethodSelect('card')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Credit/Debit Card</p>
              <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          {paymentMethod === 'mtn_momo' && (
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MTN</span>
            </div>
          )}
          {paymentMethod === 'airtel_money' && (
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AIRTEL</span>
            </div>
          )}
          {paymentMethod === 'card' && (
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Enter Phone Number</h3>
            <p className="text-gray-600">
              {paymentMethod === 'card' 
                ? 'Enter your phone number for verification' 
                : 'Enter your mobile money phone number'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePhoneNumberSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="07XX XXX XXX or 256 7XX XXX XXX"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter your Uganda phone number (MTN or Airtel)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Payment</h3>
        <p className="text-gray-600">Review your payment details</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-semibold">{plan.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Billing Cycle:</span>
            <span className="font-semibold capitalize">{billingCycle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-semibold capitalize">{paymentMethod.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone Number:</span>
            <span className="font-semibold">{phoneNumber}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-lg font-bold text-blue-600">{formatPrice(pricing.price)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handlePaymentSubmit}
          disabled={processing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-2 inline" />
              Processing Payment...
            </>
          ) : (
            `Pay ${formatPrice(pricing.price)}`
          )}
        </button>
        
        <button
          onClick={() => setStep(2)}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <Shield className="w-4 h-4 inline mr-1" />
        Your payment is secure and encrypted
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your Phone</h3>
        <p className="text-gray-600">
          {paymentMethod === 'card' 
            ? 'We\'ve sent a verification code to your phone'
            : `We've sent a payment request to your ${paymentMethod.replace('_', ' ')} account`
          }
        </p>
      </div>

      {paymentMethod !== 'card' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-medium mb-2">To complete payment:</p>
            <ol className="text-blue-800 text-sm space-y-1 text-left">
              <li>1. Check your phone for the payment request</li>
              <li>2. Enter your PIN to authorize the payment</li>
              <li>3. Wait for confirmation on this screen</li>
            </ol>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Simulate successful payment
                setVerified(true);
                setStep(5);
              }}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              I've Paid
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2 inline" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your subscription has been activated</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-semibold">{plan.displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold">{formatPrice(pricing.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-mono text-sm">{transaction?.reference || 'TXN' + Date.now()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onSuccess}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
        
        <button
          onClick={resetForm}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Make Another Payment
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 1 && 'Payment Method'}
                {step === 2 && 'Phone Number'}
                {step === 3 && 'Confirm Payment'}
                {step === 4 && 'Complete Payment'}
                {step === 5 && 'Payment Complete'}
              </h2>
              <p className="text-sm text-gray-600">
                {plan.displayName} - {billingCycle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > stepNumber ? '✓' : stepNumber}
                  </div>
                  {stepNumber < 5 && (
                    <div className={`w-full h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>
        </div>
      </div>
    </div>
  );
}
