import React, { useState, useEffect } from 'react';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';
import { exchangeService } from '@/services/exchangeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Simple Currency Test Component
 * Debug tool to verify currency conversion is working
 */
export const CurrencyTest: React.FC = () => {
  const { selectedCurrency, setCurrency, exchangeRates, ratesSource, formatCurrency, convertAmount } = useCurrency();
  const [testAmount, setTestAmount] = useState(10000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog(`Exchange rates loaded: ${Object.keys(exchangeRates).length} currencies`);
    addLog(`Rates source: ${ratesSource}`);
    addLog(`Current currency: ${selectedCurrency.code}`);
  }, [exchangeRates, ratesSource, selectedCurrency]);

  const runTest = () => {
    addLog(`--- Test: ${testAmount} ${fromCurrency} to ${selectedCurrency.code} ---`);
    
    // Check if rates exist
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[selectedCurrency.code];
    
    addLog(`Rate for ${fromCurrency}: ${fromRate || 'NOT FOUND'}`);
    addLog(`Rate for ${selectedCurrency.code}: ${toRate || 'NOT FOUND'}`);
    
    // Try conversion
    const converted = convertAmount(testAmount, fromCurrency, selectedCurrency.code);
    addLog(`Converted amount: ${converted}`);
    
    // Try formatting
    const formatted = formatCurrency(testAmount, fromCurrency);
    addLog(`Formatted: ${formatted}`);
  };

  const refreshRates = async () => {
    addLog('Refreshing rates...');
    try {
      const result = await exchangeService.getRates(true);
      addLog(`Got ${Object.keys(result.rates).length} rates from ${result.source}`);
    } catch (err) {
      addLog(`Error: ${err}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Currency Conversion Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">From Currency</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.slice(0, 20).map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">To Currency (Selected)</label>
              <Select 
                value={selectedCurrency.code} 
                onValueChange={(code) => {
                  const c = CURRENCIES.find(x => x.code === code);
                  if (c) setCurrency(c);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runTest}>Run Test</Button>
            <Button onClick={refreshRates} variant="outline">Refresh Rates</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(testAmount, fromCurrency)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {testAmount.toLocaleString()} {fromCurrency} should convert to approximately:
          </div>
          <div className="text-xl mt-1">
            {fromCurrency !== selectedCurrency.code && (
              <>Rate: 1 {fromCurrency} = {exchangeRates[selectedCurrency.code] ? (exchangeRates[selectedCurrency.code] / (exchangeRates[fromCurrency] || 1)).toFixed(2) : '?' } {selectedCurrency.code}</>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Rates ({Object.keys(exchangeRates).length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {Object.entries(exchangeRates).slice(0, 20).map(([code, rate]) => (
              <div key={code} className="bg-gray-100 p-2 rounded">
                {code}: {rate.toFixed(2)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyTest;
