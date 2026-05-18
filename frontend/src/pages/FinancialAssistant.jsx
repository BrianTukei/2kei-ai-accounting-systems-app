import React, { useState } from 'react';
import { categorizeTransactions, generateIncomeStatement, detectAnomalies, predictCashflow } from '../utils/financeUtils';

export default function FinancialAssistant() {
  const [input, setInput] = useState('[]');
  const [results, setResults] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function parseInput() {
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      return [];
    }
  }

  const runCategorize = () => {
    const tx = parseInput();
    setResults(prev => ({ ...prev, categorized: categorizeTransactions(tx) }));
  };

  const runIncome = () => {
    const tx = parseInput();
    setResults(prev => ({ ...prev, incomeStatement: generateIncomeStatement(tx, { startDate, endDate }) }));
  };

  const runAnomalies = () => {
    const tx = parseInput();
    setResults(prev => ({ ...prev, anomalies: detectAnomalies(tx) }));
  };

  const runPredict = () => {
    const tx = parseInput();
    setResults(prev => ({ ...prev, prediction: predictCashflow(tx, { days: 30 }) }));
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Financial Assistant</h2>

      <p>Paste transactions JSON (array of objects with at least <em>date</em> and <em>amount</em>).</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={10} style={{ width: '100%' }} />

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={runCategorize}>Categorize</button>
        <button onClick={runIncome}>Income Statement</button>
        <button onClick={runAnomalies}>Detect Anomalies</button>
        <button onClick={runPredict}>Predict Cashflow</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Start Date: <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></label>
        <label style={{ marginLeft: 8 }}>End Date: <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></label>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>Results</h3>
        <pre style={{ maxHeight: 400, overflow: 'auto', background: '#f6f8fa', padding: 8 }}>{JSON.stringify(results, null, 2)}</pre>
      </div>
    </div>
  );
}
