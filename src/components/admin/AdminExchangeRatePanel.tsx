/**
 * Admin Exchange Rate Panel
 * ─────────────────────────
 * Admin-only component for viewing and managing exchange rates.
 * Features:
 *   - Live rates table with source indicators
 *   - Admin override management (set/remove)
 *   - Rate history chart
 *   - Force refresh button
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrency, CURRENCIES } from '@/contexts/CurrencyContext';
import { exchangeService, type RateOverride, type RateHistoryPoint } from '@/services/exchangeService';
import {
  RefreshCw,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
} from 'lucide-react';

export default function AdminExchangeRatePanel() {
  const { toast } = useToast();
  const { exchangeRates, ratesSource, ratesLastUpdated, isRatesLoading, refreshRates } = useCurrency();

  const [overrides, setOverrides] = useState<RateOverride[]>([]);
  const [history, setHistory] = useState<RateHistoryPoint[]>([]);
  const [selectedHistoryCurrency, setSelectedHistoryCurrency] = useState('EUR');
  const [isLoadingOverrides, setIsLoadingOverrides] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Override form state
  const [overrideTarget, setOverrideTarget] = useState('');
  const [overrideRate, setOverrideRate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSettingOverride, setIsSettingOverride] = useState(false);

  // Search/filter for rates table
  const [rateSearch, setRateSearch] = useState('');

  useEffect(() => {
    loadOverrides();
  }, []);

  useEffect(() => {
    loadHistory(selectedHistoryCurrency);
  }, [selectedHistoryCurrency]);

  const loadOverrides = async () => {
    setIsLoadingOverrides(true);
    try {
      const data = await exchangeService.getOverrides();
      setOverrides(data);
    } catch {
      // silent
    } finally {
      setIsLoadingOverrides(false);
    }
  };

  const loadHistory = async (currency: string) => {
    setIsLoadingHistory(true);
    try {
      const data = await exchangeService.getHistory(currency, 30);
      setHistory(data);
    } catch {
      // silent
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRates();
      toast({ title: 'Rates refreshed', description: 'Exchange rates updated from live API.' });
    } catch {
      toast({ title: 'Refresh failed', description: 'Could not fetch live rates.', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSetOverride = async () => {
    if (!overrideTarget || !overrideRate || isNaN(Number(overrideRate)) || Number(overrideRate) <= 0) {
      toast({ title: 'Invalid input', description: 'Select a currency and enter a valid rate.', variant: 'destructive' });
      return;
    }

    setIsSettingOverride(true);
    try {
      await exchangeService.setOverride(overrideTarget, Number(overrideRate), overrideReason);
      toast({ title: 'Override set', description: `Rate override for USD→${overrideTarget} saved.` });
      setOverrideTarget('');
      setOverrideRate('');
      setOverrideReason('');
      await loadOverrides();
      await refreshRates();
    } catch {
      toast({ title: 'Failed', description: 'Could not set rate override.', variant: 'destructive' });
    } finally {
      setIsSettingOverride(false);
    }
  };

  const handleRemoveOverride = async (target: string) => {
    try {
      await exchangeService.removeOverride(target);
      toast({ title: 'Override removed', description: `Rate override for USD→${target} removed.` });
      await loadOverrides();
      await refreshRates();
    } catch {
      toast({ title: 'Failed', description: 'Could not remove override.', variant: 'destructive' });
    }
  };

  // Filter rates by search
  const rateEntries = Object.entries(exchangeRates)
    .filter(([code]) => {
      if (!rateSearch) return true;
      const search = rateSearch.toUpperCase();
      const currency = CURRENCIES.find(c => c.code === code);
      return code.includes(search) || (currency?.name.toUpperCase().includes(search));
    })
    .sort(([a], [b]) => a.localeCompare(b));

  const overrideSet = new Set(overrides.map(o => o.target_currency));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exchange Rate Management</h2>
          <p className="text-muted-foreground">
            Manage live forex rates, overrides, and rate history
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Rates
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tracked Currencies</p>
                <p className="text-2xl font-bold">{Object.keys(exchangeRates).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {ratesSource === 'live' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : ratesSource === 'cache' ? (
                <Clock className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Rate Source</p>
                <p className="text-2xl font-bold capitalize">{ratesSource}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Overrides</p>
                <p className="text-2xl font-bold">{overrides.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {ratesLastUpdated
                    ? new Date(ratesLastUpdated).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rates">
        <TabsList>
          <TabsTrigger value="rates">Live Rates</TabsTrigger>
          <TabsTrigger value="overrides">Admin Overrides</TabsTrigger>
          <TabsTrigger value="history">Rate History</TabsTrigger>
        </TabsList>

        {/* ── Live Rates Tab ──────────────────────────────────── */}
        <TabsContent value="rates" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search currency (e.g. EUR, Naira)..."
              value={rateSearch}
              onChange={(e) => setRateSearch(e.target.value)}
              className="max-w-sm"
            />
            <Badge variant="outline">{rateEntries.length} currencies</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Rate (1 USD =)</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rateEntries.map(([code, rate]) => {
                      const currency = CURRENCIES.find(c => c.code === code);
                      const isOverridden = overrideSet.has(code);
                      return (
                        <TableRow key={code}>
                          <TableCell className="font-mono font-medium">{code}</TableCell>
                          <TableCell>
                            {currency ? `${currency.symbol} ${currency.name}` : code}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(rate).toFixed(rate < 1 ? 6 : 2)}
                          </TableCell>
                          <TableCell>
                            {isOverridden ? (
                              <Badge variant="destructive" className="text-xs">Override</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs capitalize">{ratesSource}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rateEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {isRatesLoading ? 'Loading rates...' : 'No rates available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Admin Overrides Tab ─────────────────────────────── */}
        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set Rate Override</CardTitle>
              <CardDescription>
                Override live rates for specific currencies. Overrides take priority over API rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Target Currency</Label>
                  <Select value={overrideTarget} onValueChange={setOverrideTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => c.code !== 'USD').map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate (1 USD =)</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="e.g. 0.93"
                    value={overrideRate}
                    onChange={(e) => setOverrideRate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Reason (optional)</Label>
                  <Textarea
                    placeholder="e.g. Central bank rate adjustment"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={1}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSetOverride} disabled={isSettingOverride}>
                    <Plus className="mr-2 h-4 w-4" />
                    Set Override
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Overrides</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOverrides ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : overrides.length === 0 ? (
                <p className="text-muted-foreground">No active overrides. All rates are from the live API.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Override Rate</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Set At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((ov) => (
                      <TableRow key={ov.id}>
                        <TableCell className="font-mono font-medium">
                          USD → {ov.target_currency}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(ov.override_rate).toFixed(ov.override_rate < 1 ? 6 : 2)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ov.reason || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(ov.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ov.effective_until
                            ? new Date(ov.effective_until).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOverride(ov.target_currency)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rate History Tab ────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <Label>Currency</Label>
              <Select value={selectedHistoryCurrency} onValueChange={setSelectedHistoryCurrency}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.filter(c => c.code !== 'USD').slice(0, 30).map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => loadHistory(selectedHistoryCurrency)} disabled={isLoadingHistory}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Reload
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                USD → {selectedHistoryCurrency} Rate History (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <p className="text-muted-foreground">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-muted-foreground">
                  No history available for this pair. History is recorded when rates are refreshed.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((point, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(point.recorded_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(point.rate).toFixed(point.rate < 1 ? 6 : 2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={point.source === 'admin_override' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                            {point.source}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
