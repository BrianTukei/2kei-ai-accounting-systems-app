# Forex Conversion Verification & Debugging Guide

## 📋 Overview

This guide helps verify that the dynamic forex conversion system is working correctly when users change currency context throughout the application.

## 🎯 What Changed (Commit eda6198)

### Changes Made:
1. **TransactionCard.tsx** - Now dynamically converts amounts based on selected currency
2. **TransactionList.tsx** - Listens to currency context changes and refetches rates
3. **CurrencyContext.tsx** - Enhanced convertAmount with defensive checks
4. **All conversions re-trigger when `selectedCurrency` changes**

### Key Improvement:
**Before**: Only currency symbol changed when switching currencies  
**After**: Both symbol AND amount values change based on live exchange rates

---

## ✅ Testing the Fix

### Step 1: Verify Exchange Rates Are Loaded

**In Browser Developer Console:**

```javascript
// Check if rates are in CurrencyContext
// Add this to any component using useCurrency

const { exchangeRates } = useCurrency();
console.log('Available rates:', exchangeRates);
```

**Expected Output**: Object with currency codes as keys and rates as values
```json
{
  "EUR": 0.93,
  "GBP": 0.80,
  "JPY": 149.50,
  "UGX": 3780,
  "KES": 153,
  ...
}
```

### Step 2: Test Single Transaction Conversion

**Scenario**: Transaction with 1000 UGX, switching USD → GBP

1. Create/view a transaction in UGX
2. Note the amount displayed (should show in USD initially)
3. Change currency selector to GBP
4. **✅ Expected**: Amount should change to GBP equivalent (~0.27 GBP for 1000 UGX)
5. **❌ If only symbol changes**: Check Step 3 below

### Step 3: Debug Conversion Failures

If amounts aren't converting, add debugging:

**File**: `src/contexts/CurrencyContext.tsx`  
**Add this in the convertAmount callback:**

```javascript
const convertAmount = useCallback((amount: number, from: string, to?: string): number => {
  const target = (to || selectedCurrency.code).toUpperCase();
  const source = from.toUpperCase();

  console.log(`[convertAmount] ${source} → ${target}: ${amount}`);
  console.log(`[convertAmount] rates available:`, {
    source: exchangeRates[source],
    target: exchangeRates[target],
  });

  if (source === target) return amount;

  const rates = exchangeRates;
  let rate = 1;
  let found = false;

  if (source === 'USD' && rates[target]) {
    rate = rates[target];
    found = true;
    console.log(`[convertAmount] Using target rate:`, rate);
  } else if (target === 'USD' && rates[source]) {
    rate = 1 / rates[source];
    found = true;
    console.log(`[convertAmount] Using 1/source rate:`, rate);
  } else if (rates[source] && rates[target]) {
    rate = rates[target] / rates[source];
    found = true;
    console.log(`[convertAmount] Using cross rate:`, rate);
  }

  if (found) {
    const converted = Math.round(amount * rate * 100) / 100;
    console.log(`[convertAmount] Result: ${converted}`);
    return converted;
  }

  console.log(`[convertAmount] Falling back to exchangeService`);
  return exchangeService.convertSync(amount, source, target);
}, [selectedCurrency.code, exchangeRates]);
```

**Then check console when switching currencies:**
- Look for `[convertAmount]` logs
- Verify rates are being found
- Check if conversion math is correct

### Step 4: Verify Rate Fetching

**File**: `src/services/exchangeService.ts`  
**Check if Edge Function is being called:**

```javascript
// Check cache status
const { getRates } = exchangeService;
const rates = await getRates();
console.log('Fetched rates:', rates);
console.log('Source:', rates.source); // Should be 'live', 'cache', or 'fallback'
```

**Expected sources in order**:
1. `'live'` - Fresh rates from ExchangeRate-API
2. `'cache'` - Rates from Supabase cache (within 10 min TTL)
3. `'fallback'` - Hardcoded rates when API unreachable

---

## 🔍 Common Issues & Solutions

### Issue 1: "Only Symbol Changes, Amount Stays Same"

**Root Cause**: `exchangeRates` object empty or rates loading slowly

**Solution**:
1. Check browser console for errors calling Edge Function
2. Verify `EXCHANGE_RATE_API_KEY` env var is set in Supabase
3. Allow 2-3 seconds for rates to load on page refresh
4. Check Network tab → look for call to `exchange-rates` Edge Function

### Issue 2: "Conversion Shows Incorrect Amount"

**Root Cause**: Incorrect rate calculation

**Solution**:
1. Manually verify rate: `amount * (targetRate / sourceRate) = expected`
2. Example: 100 UGX → EUR = `100 * (0.93 / 3780) ≈ 0.0246 EUR`
3. Check if rates in fallback are outdated (see FALLBACK_RATES in CurrencyContext.tsx)

### Issue 3: "convertedAmount Field Always Shows USD"

**Root Cause**: Old code displaying hardcoded USD conversion

**Solution**:
- This was the original issue - should be fixed in commit eda6198
- Verify you're on the latest code: `git log --oneline | head -1`
- Should show: `eda6198 fix: implement dynamic forex conversion when currency context changes`

---

## 📊 Transaction Amount Determination

### Display Logic in TransactionCard.tsx

```typescript
// Step 1: Read transaction currency
const txCurrency = transaction.currency; // e.g., 'UGX'

// Step 2: Get selected currency from context
const { selectedCurrency } = useCurrency(); // e.g., 'EUR'

// Step 3: If different, convert
if (txCurrency !== selectedCurrency.code) {
  convertedAmount = convertAmount(amount, txCurrency, selectedCurrency.code);
}

// Step 4: Display in selected currency with formatting
displayConverted = formatCurrency(convertedAmount); // "€0.02"

// Step 5: Show original amount as reference
displayOriginal = formatCurrency(amount, txCurrency); // "USh 1000"
```

---

## 🧪 Manual Test Cases

### Test Case 1: Multi-Currency Portfolio
**Setup**: Create transactions in different currencies
- 100 USD (expense)
- 1000 UGX (income)
- 50 EUR (expense)

**Verification**:
1. View in USD → all amounts show in USD
2. Switch to EUR → all amounts show in EUR with correct conversion
3. Switch to GBP → all amounts show in GBP with correct conversion
4. **Add amounts up**: Verify math is correct
5. Note time taken to convert (should be instant, uses cached rates)

### Test Case 2: Currency Toggle Speed
**Verification**:
1. Rapidly switch between currencies (USD → EUR → GBP → USD)
2. Verify amounts update smoothly without lag
3. Check browser console for warnings/errors
4. Verify no "NaN" or undefined amounts shown

### Test Case 3: Zero-Decimal Currencies
**Verification**:
1. Create transaction in UGX (zero-decimal currency)
2. Switch to EUR (2-decimal currency)
3. Verify UGX shows as whole number: "3,780 USh"
4. Verify EUR shows with 2 decimals: "€0.98"

---

## 🔧 Developer Testing Tools

### Enable Debug Logging

Add to your component/page:

```javascript
import { useCurrency } from '@/contexts/CurrencyContext';

export function DebugForex() {
  const {
    selectedCurrency,
    exchangeRates,
    convertAmount,
    ratesSource,
    ratesLastUpdated,
  } = useCurrency();

  return (
    <div className="p-4 bg-gray-100 rounded text-sm font-mono">
      <p>Selected: {selectedCurrency.code}</p>
      <p>Rates Source: {ratesSource}</p>
      <p>Last Updated: {ratesLastUpdated}</p>
      <p>Available Rates: {Object.keys(exchangeRates).length}</p>
      <p>Test: 100 UGX → {convertAmount(100, 'UGX', selectedCurrency.code).toFixed(2)} {selectedCurrency.code}</p>
    </div>
  );
}
```

### Network Inspection

1. Open DevTools → Network tab
2. Filter for: `exchange-rates`
3. Click on request
4. Check Response tab for returned rates

**Expected Response** (from Edge Function):
```json
{
  "base": "USD",
  "rates": { "EUR": 0.93, "GBP": 0.80, ... },
  "source": "live",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "overrides": [],
  "cacheTTL": 10
}
```

---

## 🚀 Performance Metrics

After implementing dynamic conversion, expect:

| Metric | Expected | Actual |
|--------|----------|--------|
| Conversion time | < 1ms | ? |
| Display update on currency change | Instant | ? |
| API calls on currency change | 1 (batch fetch) | ? |
| Rate freshness | Max 10 min old | ? |
| Memory consumption | < 50KB rates | ? |

---

## 📝 Verification Checklist

- [ ] Rates are loading from Edge Function (check Network tab)
- [ ] `exchangeRates` object is populated in CurrencyContext
- [ ] Converting single currency pair works correctly
- [ ] All transaction amounts update when switching currency
- [ ] Zero-decimal currencies format correctly
- [ ] No console errors when switching currencies
- [ ] The original amount shows as reference (e.g., "orig: USh 1000")
- [ ] Converting back to original currency returns original amount
- [ ] Large transactions convert without precision loss
- [ ] Conversion history is accurate over multiple switches

---

## 🐛 Additional Debugging

### Check Cache Invalidation

```javascript
// In browser console
localStorage.clear(); // Clear any cached preferences
location.reload(); // Restart application
```

### Check Edge Function Logs

In Supabase Dashboard:
1. Go to Functions → exchange-rates
2. Click "Executions" tab
3. Look for recent calls
4. Check for errors or slow latency

### Fallback Rate Inspection

If API is down, verify fallback rates are reasonable:

```javascript
// Default fallback rates
UGX: 3780 per USD
EUR: 0.93 per USD
GBP: 0.80 per USD
KES: 153 per USD
```

These should be updated periodically for accuracy.

---

## ✨ Next Steps

1. **Run manual tests** from section above
2. **Check console logs** if tests fail
3. **Review Network tab** for API integration issues
4. **Update fallback rates** if they're outdated
5. **Test with real transaction data** from your database

---

## 📞 Support

If conversion still isn't working:
1. Check this entire checklist
2. Review browser console for specific error messages
3. Verify Supabase Edge Function is deployed
4. Check environment variables are set correctly
5. Review git commit eda6198 for exact changes made
