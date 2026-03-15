import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Shield,
  Target,
  Lightbulb,
  Calculator,
  Eye,
  Download,
  RefreshCw,
  Bot,
  Zap,
  Globe,
  Users,
  PieChart,
  BarChart3,
  Receipt,
  CreditCard,
  Building,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import AIAccountant from '@/components/AIAccountant';
import { aiAccountantService } from '@/services/ai/aiAccountantService';
import { localAIService } from '@/services/ai/localAIService';

export default function AIAccountantPage() {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useState(() => {
    checkServiceAvailability();
  }, []);

  const checkServiceAvailability = async () => {
    try {
      const available = await localAIService.isServiceAvailable();
      setIsServiceAvailable(available);
    } catch (error) {
      console.error('Failed to check service availability:', error);
      setIsServiceAvailable(false);
    }
  };

  const capabilities = [
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: 'Financial Analysis',
      description: 'Deep analysis of your financial data with actionable insights',
      features: ['Revenue analysis', 'Expense tracking', 'Profit optimization', 'Cash flow monitoring']
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
      title: 'Mistake Detection',
      description: 'Automatically detect accounting errors and potential fraud',
      features: ['Duplicate transactions', 'Unusual spending', 'Missing payments', 'Risk assessment']
    },
    {
      icon: <FileText className="h-8 w-8 text-green-500" />,
      title: 'Smart Reports',
      description: 'Generate professional financial reports automatically',
      features: ['Income statements', 'Cash flow reports', 'Tax summaries', 'Trend analysis']
    },
    {
      icon: <Target className="h-8 w-8 text-purple-500" />,
      title: 'Personalized Advice',
      description: 'Get tailored financial advice based on your business goals',
      features: ['Growth strategies', 'Cost optimization', 'Investment guidance', 'Risk management']
    },
    {
      icon: <Receipt className="h-8 w-8 text-red-500" />,
      title: 'Invoice Intelligence',
      description: 'AI-powered invoice processing and analysis',
      features: ['Invoice extraction', 'Payment tracking', 'Risk scoring', 'Automated categorization']
    },
    {
      icon: <Calculator className="h-8 w-8 text-indigo-500" />,
      title: 'Tax Estimation',
      description: 'Intelligent tax calculations and optimization suggestions',
      features: ['Tax liability', 'Deduction identification', 'Compliance checking', 'Deadline tracking']
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Data Collection',
      description: 'AI connects to your financial data from transactions, invoices, and expenses',
      icon: <Database className="h-6 w-6" />,
      tech: 'Database Integration'
    },
    {
      step: 2,
      title: 'AI Analysis',
      description: 'Llama 3 analyzes your data using specialized accounting knowledge',
      icon: <Brain className="h-6 w-6" />,
      tech: 'Llama 3 + Ollama'
    },
    {
      step: 3,
      title: 'Insight Generation',
      description: 'Generate actionable insights, detect issues, and provide recommendations',
      icon: <Lightbulb className="h-6 w-6" />,
      tech: 'Financial AI Engine'
    },
    {
      step: 4,
      title: 'Report Creation',
      description: 'Automatically generate professional reports and summaries',
      icon: <FileText className="h-6 w-6" />,
      tech: 'PDF Generation'
    }
  ];

  const competitiveAdvantages = [
    {
      title: '100% Free AI',
      description: 'No API costs, usage limits, or subscription fees',
      icon: <Zap className="h-6 w-6 text-green-500" />
    },
    {
      title: 'Complete Privacy',
      description: 'All financial data processed locally on your machine',
      icon: <Shield className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'African Focus',
      description: 'Specialized for African markets, currencies, and regulations',
      icon: <Globe className="h-6 w-6 text-orange-500" />
    },
    {
      title: 'Real-time Analysis',
      description: 'Instant insights without network delays',
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />
    }
  ];

  if (!isServiceAvailable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-500" />
              AI Accountant
            </h1>
            <p className="text-gray-600">
              Intelligent financial analysis and accounting insights
            </p>
          </div>
          <Badge variant="secondary">Setup Required</Badge>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Local AI Required:</strong> Install Ollama to enable the AI Accountant features.
                This ensures 100% free processing and complete privacy.
              </div>
              <Button onClick={() => setShowSetup(!showSetup)} variant="outline">
                {showSetup ? 'Hide' : 'Show'} Setup
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {showSetup && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Install Ollama</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Download and install Ollama from the official website
                    </p>
                    <Button 
                      onClick={() => window.open('https://ollama.com', '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      Download Ollama
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Run Llama 3</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Open terminal and run: <code className="bg-gray-100 px-2 py-1 rounded">ollama run llama3</code>
                    </p>
                    <p className="text-xs text-gray-500">
                      This downloads ~5GB model and starts the AI service
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Start Using AI Accountant</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Refresh this page and begin using your AI Accountant
                    </p>
                    <Button onClick={checkServiceAvailability} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Why AI Accountant?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Intelligent Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Goes beyond basic bookkeeping to provide real financial insights
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Error Detection</h4>
                    <p className="text-sm text-gray-600">
                      Automatically catches mistakes that humans might miss
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Actionable Advice</h4>
                    <p className="text-sm text-gray-600">
                      Get specific recommendations to improve your financial health
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Local Processing</h4>
                    <p className="text-sm text-gray-600">
                      Your financial data never leaves your computer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">No Tracking</h4>
                    <p className="text-sm text-gray-600">
                      We don't track, store, or analyze your data externally
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">GDPR Compliant</h4>
                    <p className="text-sm text-gray-600">
                      Built with privacy regulations in mind
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            AI Accountant
          </h1>
          <p className="text-gray-600">
            Your intelligent financial partner - powered by local AI for complete privacy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
          <Button variant="outline" onClick={checkServiceAvailability}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accountant" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accountant">
            <Bot className="h-4 w-4 mr-2" />
            AI Accountant
          </TabsTrigger>
          <TabsTrigger value="capabilities">
            <Zap className="h-4 w-4 mr-2" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Settings className="h-4 w-4 mr-2" />
            How It Works
          </TabsTrigger>
          <TabsTrigger value="advantages">
            <TrendingUp className="h-4 w-4 mr-2" />
            Advantages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accountant" className="mt-6">
          <AIAccountant />
        </TabsContent>

        <TabsContent value="capabilities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {capability.icon}
                    <div>
                      <h3 className="font-semibold">{capability.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{capability.description}</p>
                      <div className="space-y-1">
                        {capability.features.map((feature, idx) => (
                          <div key={idx} className="text-xs text-gray-500">
                            • {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Accountant Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{step.step}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {step.icon}
                          <h3 className="font-semibold">{step.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {step.tech}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Flow Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs mt-2">User Data</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs mt-2">Database</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-xs mt-2">AI Engine</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-xs mt-2">Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advantages" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitiveAdvantages.map((advantage, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {advantage.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{advantage.title}</h3>
                      <p className="text-sm text-gray-600">{advantage.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Competitive Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      <th className="text-center p-2">2K AI Accounting</th>
                      <th className="text-center p-2">QuickBooks AI</th>
                      <th className="text-center p-2">Xero AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">AI Cost</td>
                      <td className="text-center p-2 text-green-600 font-medium">FREE</td>
                      <td className="text-center p-2 text-red-600">$50+/mo</td>
                      <td className="text-center p-2 text-red-600">$40+/mo</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Privacy</td>
                      <td className="text-center p-2 text-green-600 font-medium">100% Local</td>
                      <td className="text-center p-2 text-yellow-600">Cloud-based</td>
                      <td className="text-center p-2 text-yellow-600">Cloud-based</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">African Currencies</td>
                      <td className="text-center p-2 text-green-600 font-medium">30+ Supported</td>
                      <td className="text-center p-2 text-red-600">Limited</td>
                      <td className="text-center p-2 text-red-600">Limited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Usage Limits</td>
                      <td className="text-center p-2 text-green-600 font-medium">Unlimited</td>
                      <td className="text-center p-2 text-red-600">Limited</td>
                      <td className="text-center p-2 text-red-600">Limited</td>
                    </tr>
                    <tr>
                      <td className="p-2">Offline Capability</td>
                      <td className="text-center p-2 text-green-600 font-medium">Full Support</td>
                      <td className="text-center p-2 text-red-600">No</td>
                      <td className="text-center p-2 text-red-600">No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
