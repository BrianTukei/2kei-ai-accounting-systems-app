/**
 * AI Dashboard
 * ────────────────────────────────────────────────────────────────────────────
 * Comprehensive dashboard showcasing all AI capabilities including
 * insights, receipt scanning, financial analysis, and AI chat.
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, FileText, AlertTriangle, 
  DollarSign, Target, Zap, BarChart3, 
  Upload, MessageCircle, Settings, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedAIChat } from './EnhancedAIChat';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
  generatedAt: string;
}

interface ReceiptScan {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  confidence: number;
  status: 'pending' | 'processed' | 'duplicate';
}

interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export const AIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'receipts' | 'chat'>('overview');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recentScans, setRecentScans] = useState<ReceiptScan[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStats, setAiStats] = useState({
    totalInsights: 0,
    criticalIssues: 0,
    opportunities: 0,
    scansProcessed: 0,
    accuracyRate: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadInsights(),
        loadRecentScans(),
        loadFinancialMetrics(),
        loadAIStats(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.data.insights || []);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const loadRecentScans = async () => {
    try {
      const response = await fetch('/api/ai/receipts/recent');
      const data = await response.json();
      if (data.success) {
        setRecentScans(data.data.scans || []);
      }
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    }
  };

  const loadFinancialMetrics = async () => {
    try {
      const response = await fetch('/api/ai/metrics');
      const data = await response.json();
      if (data.success) {
        setFinancialMetrics(data.data.metrics || []);
      }
    } catch (error) {
      console.error('Failed to load financial metrics:', error);
    }
  };

  const loadAIStats = async () => {
    try {
      const response = await fetch('/api/ai/stats');
      const data = await response.json();
      if (data.success) {
        setAiStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'opportunity': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* AI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-gray-900">{aiStats.totalInsights}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">{aiStats.criticalIssues}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Opportunities</p>
              <p className="text-2xl font-bold text-green-600">{aiStats.opportunities}</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(aiStats.accuracyRate * 100).toFixed(1)}%</p>
            </div>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financialMetrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                {metric.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(metric.value)}</p>
                <div className="flex items-center space-x-1">
                  {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                  {metric.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
                  <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Insights */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(insight.severity)}`}>
                        {insight.severity}
                      </span>
                      <span className={`text-xs ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Receipt Scans */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipt Scans</h3>
          <div className="space-y-3">
            {recentScans.slice(0, 3).map((scan) => (
              <div key={scan.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{scan.merchant}</h4>
                    <p className="text-sm text-gray-600">{formatCurrency(scan.amount)} • {scan.category}</p>
                    <p className="text-xs text-gray-500">{new Date(scan.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      scan.status === 'processed' ? 'bg-green-100 text-green-800' :
                      scan.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {scan.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{(scan.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Financial Insights</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityColor(insight.severity)}`}>
                  {insight.severity}
                </span>
                <span className={`text-sm ${getImpactColor(insight.impact)}`}>
                  {insight.impact} impact
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-lg font-semibold text-gray-900">{(insight.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-gray-600 mb-4">{insight.description}</p>

            {insight.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Generated {new Date(insight.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Receipt Scanner</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Upload Receipt</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
        <div className="space-y-4">
          {recentScans.map((scan) => (
            <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{scan.merchant}</h4>
                  <p className="text-sm text-gray-600">{scan.category} • {new Date(scan.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(scan.amount)}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    scan.status === 'processed' ? 'bg-green-100 text-green-800' :
                    scan.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {scan.status}
                  </span>
                  <span className="text-xs text-gray-500">{(scan.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full">
      <EnhancedAIChat />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Dashboard</h1>
                <p className="text-sm text-gray-500">Intelligent Financial Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'receipts', label: 'Receipt Scanner', icon: FileText },
              { id: 'chat', label: 'AI Chat', icon: MessageCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-gray-600">Loading dashboard...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'insights' && renderInsights()}
            {activeTab === 'receipts' && renderReceipts()}
            {activeTab === 'chat' && renderChat()}
          </>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;
