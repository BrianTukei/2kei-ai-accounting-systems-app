/**
 * Lightweight finance utilities for client-side analysis.
 * These are deterministic, audit-friendly helpers intended as
 * minimal implementations of the requested AI accounting features.
 */

// Helper: parse ISO-like date or number (epoch)
function toDate(d) {
  if (!d) return null;
  const t = typeof d === 'number' ? new Date(d) : new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

export function categorizeTransactions(transactions) {
  const rules = [
    { match: /salary|payroll|payroll/i, cat: 'Payroll' },
    { match: /uber|lyft|taxi|transport/i, cat: 'Transport' },
    { match: /office|stationery|supplies|stationary/i, cat: 'Office Supplies' },
    { match: /rent|lease/i, cat: 'Rent' },
    { match: /utilities|electric|water|internet/i, cat: 'Utilities' },
    { match: /invoice|sale|payment from|payment recieved|payment received/i, cat: 'Sales' },
    { match: /refund/i, cat: 'Refunds' },
  ];

  return transactions.map(tx => {
    const desc = (tx.description || tx.memo || tx.payee || '') + '';
    const lower = desc.toLowerCase();
    let category = tx.category || 'Uncategorized';
    for (const r of rules) {
      if (r.match.test(desc)) {
        category = r.cat;
        break;
      }
    }
    return { ...tx, category };
  });
}

export function generateIncomeStatement(transactions = [], { startDate, endDate } = {}) {
  const s = toDate(startDate);
  const e = toDate(endDate);
  const filtered = transactions.filter(tx => {
    const d = toDate(tx.date);
    if (!d) return false;
    if (s && d < s) return false;
    if (e && d > e) return false;
    return true;
  });

  let revenue = 0;
  let expenses = 0;

  for (const tx of filtered) {
    const amt = Number(tx.amount) || 0;
    if (amt > 0) revenue += amt; else expenses += Math.abs(amt);
  }

  const grossProfit = revenue; // simplistic: no COGS breakdown
  const netIncome = revenue - expenses;

  return {
    period: { start: s ? s.toISOString() : null, end: e ? e.toISOString() : null },
    revenue: Number(revenue.toFixed(2)),
    expenses: Number(expenses.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    netIncome: Number(netIncome.toFixed(2)),
  };
}

export function detectAnomalies(transactions = []) {
  // Duplicate detection (same date, amount, payee/description)
  const seen = new Map();
  const duplicates = [];
  transactions.forEach((tx, idx) => {
    const key = `${tx.date}|${tx.amount}|${(tx.description||tx.payee||'').trim().toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.push({ index: idx, tx, duplicateOf: seen.get(key) });
    } else {
      seen.set(key, idx);
    }
  });

  // Simple outlier detection using median absolute deviation on amounts
  const amounts = transactions.map(t => Math.abs(Number(t.amount) || 0)).filter(a => a > 0);
  const med = amounts.length ? amounts.slice().sort((a,b)=>a-b)[Math.floor(amounts.length/2)] : 0;
  const deviations = amounts.map(a => Math.abs(a - med));
  const mad = deviations.length ? deviations.slice().sort((a,b)=>a-b)[Math.floor(deviations.length/2)] : 0;
  const outliers = [];
  if (mad > 0) {
    transactions.forEach((tx, idx) => {
      const a = Math.abs(Number(tx.amount) || 0);
      const score = Math.abs(a - med) / mad;
      if (score > 5) outliers.push({ index: idx, tx, score: Number(score.toFixed(2)) });
    });
  }

  return { duplicates, outliers };
}

export function predictCashflow(transactions = [], { days = 30, startingBalance = null } = {}) {
  // Create daily net flows
  const daily = new Map();
  transactions.forEach(tx => {
    const d = toDate(tx.date);
    if (!d) return;
    const key = d.toISOString().slice(0,10);
    const amt = Number(tx.amount) || 0;
    daily.set(key, (daily.get(key)||0) + amt);
  });

  const sortedDates = Array.from(daily.keys()).sort();
  if (sortedDates.length === 0) return { prediction: [], avgDailyNet: 0 };

  // compute average daily net change
  const nets = sortedDates.map(d => daily.get(d));
  const avgDaily = nets.reduce((a,b)=>a+b,0)/Math.max(1,nets.length);

  // determine last known balance if not provided by user by cumulatively summing amounts
  let lastBalance = 0;
  if (startingBalance !== null && !isNaN(Number(startingBalance))) {
    lastBalance = Number(startingBalance);
  } else {
    // assume starting at 0 and sum all transactions up to last date
    lastBalance = transactions.reduce((s, t) => s + (Number(t.amount)||0), 0);
  }

  const predictions = [];
  const lastDate = new Date(sortedDates[sortedDates.length-1]);
  for (let i=1;i<=days;i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    lastBalance = lastBalance + avgDaily;
    predictions.push({ date: d.toISOString().slice(0,10), predictedBalance: Number(lastBalance.toFixed(2)) });
  }

  return { prediction: predictions, avgDailyNet: Number(avgDaily.toFixed(2)) };
}
