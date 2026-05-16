/**
 * Integration Guide: Using Enhanced AI Services in React Components
 * ════════════════════════════════════════════════════════════════════════
 * 
 * This guide shows how to integrate the new super-intelligent AI services
 * into your React components for invoice generation, receipt scanning,
 * financial analysis, and forecasting.
 * ════════════════════════════════════════════════════════════════════════
 */

// ── EXAMPLE 1: Invoice Generation Component ─────────────────────────────

import React, { useState } from 'react';
import { advancedInvoiceService } from '@/services/ai';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoiceGenerator = () => {
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [invoice, setInvoice] = useState(null);

  const handleGenerateInvoice = () => {
    const newInvoice = advancedInvoiceService.createInvoice({
      clientName,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });

    setInvoice(newInvoice);
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    doc.text('INVOICE', 10, 10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 10, 20);
    doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, 10, 30);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 10, 40);
    doc.text(`Client: ${invoice.clientName}`, 10, 50);

    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity,
      item.unitPrice,
      item.total
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData
    });

    doc.text(`Subtotal: $${invoice.subtotal}`, 10, doc.lastAutoTable.finalY + 20);
    doc.text(`Tax: $${invoice.totalTax}`, 10, doc.lastAutoTable.finalY + 30);
    doc.text(`Total: $${invoice.total}`, 10, doc.lastAutoTable.finalY + 40);

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Generate Invoice</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Client Name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Items</label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Description"
              value={item.description}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].description = e.target.value;
                setItems(newItems);
              }}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].quantity = Number(e.target.value);
                setItems(newItems);
              }}
              className="w-20 px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              placeholder="Price"
              value={item.unitPrice}
              onChange={(e) => {
                const newItems = [...items];
                newItems[index].unitPrice = Number(e.target.value);
                setItems(newItems);
              }}
              className="w-24 px-3 py-2 border rounded-md"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerateInvoice}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Generate Invoice
      </button>

      {invoice && (
        <div className="bg-gray-50 p-4 rounded-md">
          <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Total:</strong> ${invoice.total}</p>
          <p><strong>Status:</strong> {invoice.status}</p>
          
          <button
            onClick={handleDownloadPDF}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

// ── EXAMPLE 2: Receipt Scanner Component ─────────────────────────────────

import React, { useState } from 'react';
import { advancedReceiptScanner } from '@/services/ai';

export const ReceiptScanner = () => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        const scannedReceipt = await advancedReceiptScanner.scanReceiptImage(imageData);
        setReceipt(scannedReceipt);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(`Error scanning receipt: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Scan Receipt</h2>

      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
          className="w-full"
        />
        {loading && <p className="text-blue-600 mt-2">Scanning receipt...</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {receipt && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="mb-4">
            <p><strong>Merchant:</strong> {receipt.merchantName}</p>
            <p><strong>Date:</strong> {receipt.transactionDate.toLocaleDateString()}</p>
            <p><strong>Total:</strong> ${receipt.total}</p>
            <p><strong>Quality Score:</strong> {receipt.qualityScore}%</p>
          </div>

          {receipt.suspiciousFlags.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <p className="font-bold text-yellow-800">⚠️ Warnings:</p>
              <ul className="list-disc list-inside mt-2">
                {receipt.suspiciousFlags.map((flag, i) => (
                  <li key={i} className="text-yellow-800">{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <p className="font-bold mb-2">Items:</p>
            <div className="space-y-2">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {receipt.recommendations.length > 0 && (
            <div className="p-3 bg-blue-100 border border-blue-400 rounded">
              <p className="font-bold text-blue-800">💡 Recommendations:</p>
              <ul className="list-disc list-inside mt-2">
                {receipt.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i} className="text-blue-800">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── EXAMPLE 3: Financial Forecast Component ──────────────────────────────

import React, { useState, useEffect } from 'react';
import { advancedForecastingEngine } from '@/services/ai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const FinancialForecast = ({ currentBalance }: { currentBalance: number }) => {
  const [forecast, setForecast] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    // In a real app, load historical data first
    const newForecast = advancedForecastingEngine.generateCashFlowForecast(period, currentBalance);
    setForecast(newForecast);
  }, [period, currentBalance]);

  if (!forecast) return <div>Loading forecast...</div>;

  const chartData = [
    {
      name: 'Start',
      income: 0,
      expenses: 0,
      balance: currentBalance
    },
    {
      name: `Day ${period}`,
      income: forecast.projectedIncome,
      expenses: forecast.projectedExpenses,
      balance: forecast.projectedEndingBalance
    }
  ];

  const riskColor = 
    forecast.riskAssessment.cashFlowRisk === 'high' ? 'red' :
    forecast.riskAssessment.cashFlowRisk === 'medium' ? 'yellow' :
    'green';

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Financial Forecast</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Forecast Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="px-3 py-2 border rounded-md"
        >
          <option value={30}>30 Days</option>
          <option value={60}>60 Days</option>
          <option value={90}>90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Projected Income</p>
          <p className="text-2xl font-bold">${forecast.projectedIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <p className="text-sm text-gray-600">Projected Expenses</p>
          <p className="text-2xl font-bold">${forecast.projectedExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className={`p-4 rounded mb-4 text-${riskColor}-900 bg-${riskColor}-50 border border-${riskColor}-300`}>
        <p className="font-bold">Risk Level: {forecast.riskAssessment.cashFlowRisk.toUpperCase()}</p>
        <p>Cash Runway: {forecast.riskAssessment.runwayMonths.toFixed(1)} months</p>
        <p className="text-sm mt-2">{forecast.riskAssessment.recommendations[0]}</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="balance" stroke="#8884d8" />
          <Line type="monotone" dataKey="income" stroke="#82ca9d" />
          <Line type="monotone" dataKey="expenses" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6">
        <h3 className="font-bold mb-2">Breakdown by Category:</h3>
        <div className="space-y-2">
          {forecast.incomeBreakdown.map((cat) => (
            <div key={cat.category} className="flex justify-between">
              <span>{cat.category}</span>
              <span className="text-green-600">${cat.projectedAmount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── EXAMPLE 4: AI Assistant Component ────────────────────────────────────

import React, { useState } from 'react';
import { enhancedAICore } from '@/services/ai';

export const AIAssistant = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    try {
      const response = await enhancedAICore.processUserQuery(userId, userMessage);
      
      const assistantMessage = `
${response.response}

💡 Key Points:
${response.actionItems.map(item => `• ${item}`).join('\n')}

📊 Insights:
${response.financialInsights.map(i => `• ${i.title}: ${i.recommendation}`).join('\n')}
      `;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${
              msg.role === 'user'
                ? 'ml-auto bg-blue-100 text-blue-900'
                : 'mr-auto bg-gray-100 text-gray-900'
            } p-3 rounded-lg max-w-xs whitespace-pre-wrap`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-500 italic">AI is thinking...</div>}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me anything..."
          disabled={loading}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// ── MAIN APP INTEGRATION ─────────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invoices" element={<InvoiceGenerator />} />
        <Route path="/receipts" element={<ReceiptScanner />} />
        <Route path="/forecast" element={<FinancialForecast currentBalance={50000} />} />
        <Route path="/ai-assistant" element={<AIAssistant userId="user-123" />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTEGRATION CHECKLIST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ✅ Install dependencies (already done - no new deps needed)
 * ✅ Set up environment variables (.env.local with API keys)
 * ✅ Import services from @/services/ai
 * ✅ Copy component examples above
 * ✅ Integrate with your routing
 * ✅ Test each component
 * ✅ Add to your UI/navigation
 * ✅ Handle errors and loading states
 * ✅ Style as needed for your design
 * ✅ Deploy to production
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
