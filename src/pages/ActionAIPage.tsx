import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Zap, 
  Shield, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Users,
  Target,
  Brain,
  Settings,
  Clock,
  BarChart3,
  Rocket,
  Lightbulb,
  Code,
  Database,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import ActionAIChatbot from '@/components/ActionAIChatbot';

export default function ActionAIPage() {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [serviceCapabilities, setServiceCapabilities] = useState<any>(null);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    checkServiceAvailability();
    loadCapabilities();
    loadRecentActions();
  }, []);

  const checkServiceAvailability = async () => {
    try {
      const response = await fetch('/api/action-ai/status');
      if (response.ok) {
        const data = await response.json();
        setIsServiceAvailable(data.data.available);
      }
    } catch (error) {
      console.error('Failed to check service availability:', error);
      setIsServiceAvailable(false);
    }
  };

  const loadCapabilities = async () => {
    try {
      const response = await fetch('/api/action-ai/capabilities');
      if (response.ok) {
        const data = await response.json();
        setServiceCapabilities(data.data);
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  const loadRecentActions = async () => {
    // Mock recent actions - in real app, fetch from database
    setRecentActions([
      {
        action: 'create_invoice',
        description: 'Created invoice for John - $300',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        success: true
      },
      {
        action: 'create_expense',
        description: 'Added expense: Office Supplies - $50',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        success: true
      },
      {
        action: 'view_financial_summary',
        description: 'Generated monthly financial summary',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        success: true
      }
    ]);
  };

  const actionCapabilities = [
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: 'Natural Language Understanding',
      description: 'AI understands user requests in plain English and converts them to actions',
      features: ['Intent recognition', 'Parameter extraction', 'Context awareness', 'Error handling']
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: 'Action Execution',
      description: 'Automatically performs tasks like creating invoices, expenses, and reports',
      features: ['Real-time execution', 'Parameter validation', 'Error recovery', 'Success confirmation']
    },
    {
      icon: <Database className="h-8 w-8 text-blue-500" />,
      title: 'System Integration',
      description: 'Seamlessly integrates with all accounting modules and databases',
      features: ['Module connectivity', 'Data consistency', 'Transaction safety', 'Audit trails']
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: 'Security & Validation',
      description: 'Ensures all actions are authorized and validated before execution',
      features: ['User authentication', 'Permission checks', 'Input validation', 'Audit logging']
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-red-500" />,
      title: 'Financial Intelligence',
      description: 'Analyzes data and provides insights while performing actions',
      features: ['Spending analysis', 'Trend detection', 'Anomaly alerts', 'Recommendations']
    },
    {
      icon: <Rocket className="h-8 w-8 text-indigo-500" />,
      title: 'Performance & Speed',
      description: 'Executes actions in real-time with confidence scoring',
      features: ['Sub-second responses', 'Confidence metrics', 'Batch processing', 'Async execution']
    }
  ];

  const availableActions = [
    {
      name: 'create_invoice',
      description: 'Create a new invoice for a client',
      example: 'Create an invoice for John for $300',
      parameters: ['client', 'amount', 'description', 'due_date'],
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: 'create_expense',
      description: 'Add a new expense entry',
      example: 'Add expense for office supplies $50',
      parameters: ['vendor', 'amount', 'category', 'date'],
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: 'add_client',
      description: 'Add a new client to the system',
      example: 'Add client Mary with email mary@example.com',
      parameters: ['name', 'email', 'phone', 'address'],
      icon: <Users className="h-4 w-4" />
    },
    {
      name: 'generate_report',
      description: 'Generate financial reports',
      example: 'Generate profit loss report',
      parameters: ['type', 'start_date', 'end_date'],
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      name: 'view_financial_summary',
      description: 'Show financial overview',
      example: 'Show me my financial summary',
      parameters: ['period', 'start_date', 'end_date'],
      icon: <Target className="h-4 w-4" />
    },
    {
      name: 'scan_receipt',
      description: 'Process receipt images with AI',
      example: 'Scan receipt for lunch expenses',
      parameters: ['file_path', 'category'],
      icon: <Zap className="h-4 w-4" />
    },
    {
      name: 'analyze_expenses',
      description: 'Analyze spending patterns',
      example: 'Analyze my expenses',
      parameters: ['period', 'category'],
      icon: <Brain className="h-4 w-4" />
    },
    {
      name: 'add_bill',
      description: 'Add a new bill to track',
      example: 'Add bill for utilities $150',
      parameters: ['vendor', 'amount', 'due_date'],
      icon: <FileText className="h-4 w-4" />
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'User Input',
      description: 'User types natural language request like "Create invoice for John for $300"',
      icon: <Users className="h-6 w-6" />,
      tech: 'Natural Language Processing'
    },
    {
      step: 2,
      title: 'AI Understanding',
      description: 'Llama 3 analyzes intent and extracts structured command with parameters',
      icon: <Brain className="h-6 w-6" />,
      tech: 'Llama 3 + Ollama'
    },
    {
      step: 3,
      title: 'Action Execution',
      description: 'Backend executes the action and updates database',
      icon: <Play className="h-6 w-6" />,
      tech: 'Express.js + Supabase'
    },
    {
      step: 4,
      title: 'Result Confirmation',
      description: 'AI confirms success and provides feedback to user',
      icon: <CheckCircle className="h-6 w-6" />,
      tech: 'Real-time Response'
    }
  ];

  const competitiveAdvantages = [
    {
      title: 'Action-Oriented AI',
      description: 'Not just answers questions - performs real actions in your system',
      icon: <Zap className="h-6 w-6 text-purple-500" />
    },
    {
      title: 'Natural Language',
      description: 'Users can type commands in plain English - no technical knowledge needed',
      icon: <Brain className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Real-time Execution',
      description: 'Actions are performed instantly with confirmation and feedback',
      icon: <Clock className="h-6 w-6 text-green-500" />
    },
    {
      title: '100% Free',
      description: 'Powered by Llama 3 - no per-action costs or usage limits',
      icon: <Shield className="h-6 w-6 text-orange-500" />
    }
  ];

  if (!isServiceAvailable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Play className="h-8 w-8 text-purple-500" />
              Action AI Assistant
            </h1>
            <p className="text-gray-600">
              Intelligent AI that performs actions in your accounting system
            </p>
          </div>
          <Badge variant="secondary">Setup Required</Badge>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Action AI Required:</strong> Ensure your backend is running with Action AI integration.
                This enables the AI to execute commands directly in your system.
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
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Start Backend Server</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Run the backend with Action AI integration
                    </p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      npm run dev:backend
                    </code>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Ensure Ollama is Running</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Make sure Llama 3 model is available
                    </p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      ollama run llama3
                    </code>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Test Action AI</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Try a simple command like "Create invoice for John for $300"
                    </p>
                    <Button onClick={checkServiceAvailability} variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Connection
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
                <Play className="h-5 w-5" />
                What is Action AI?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Action-Oriented</h4>
                    <p className="text-sm text-gray-600">
                      Not just answers questions - performs real actions in your accounting system
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Natural Language</h4>
                    <p className="text-sm text-gray-600">
                      Type commands in plain English - no technical knowledge required
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Real-time Execution</h4>
                    <p className="text-sm text-gray-600">
                      Actions are performed instantly with confirmation and feedback
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Example Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="font-medium text-purple-900">"Create invoice for John for $300"</p>
                  <p className="text-sm text-purple-700">→ Creates invoice with client John and amount $300</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="font-medium text-blue-900">"Add expense for office supplies $50"</p>
                  <p className="text-sm text-blue-700">→ Adds expense entry with vendor and category</p>
                </div>
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="font-medium text-green-900">"Generate profit loss report"</p>
                  <p className="text-sm text-green-700">→ Creates and displays financial report</p>
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
            <Play className="h-8 w-8 text-purple-500" />
            Action AI Assistant
          </h1>
          <p className="text-gray-600">
            Intelligent AI that performs actions in your accounting system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
          <Button variant="outline" onClick={checkServiceAvailability}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Status
          </Button>
        </div>
      </div>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Actions
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    action.success ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{action.description}</p>
                    <p className="text-xs text-gray-500">{action.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {action.timestamp.toLocaleTimeString()}
                  </p>
                  <Badge variant={action.success ? 'default' : 'destructive'} className="text-xs">
                    {action.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chatbot">
            <Play className="h-4 w-4 mr-2" />
            Action AI
          </TabsTrigger>
          <TabsTrigger value="actions">
            <Zap className="h-4 w-4 mr-2" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="capabilities">
            <Brain className="h-4 w-4 mr-2" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Code className="h-4 w-4 mr-2" />
            How It Works
          </TabsTrigger>
          <TabsTrigger value="advantages">
            <TrendingUp className="h-4 w-4 mr-2" />
            Advantages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="mt-6">
          <div className="h-[600px]">
            <ActionAIChatbot />
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableActions.map((action, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      <div className="bg-gray-100 rounded p-2 text-left">
                        <p className="text-xs font-medium mb-1">Example:</p>
                        <p className="text-xs italic">"{action.example}"</p>
                      </div>
                      <div className="mt-2 text-left">
                        <p className="text-xs font-medium mb-1">Parameters:</p>
                        <div className="flex flex-wrap gap-1">
                          {action.parameters.map(param => (
                            <Badge key={param} variant="outline" className="text-xs">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actionCapabilities.map((capability, index) => (
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
                <CardTitle>Action AI Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workflowSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{step.step}</div>
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
                <CardTitle>Technical Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Frontend</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• React + TypeScript interface</li>
                      <li>• Natural language input</li>
                      <li>• Real-time action feedback</li>
                      <li>• Confidence scoring display</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Backend & AI</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Express.js API endpoints</li>
                      <li>• Llama 3 via Ollama</li>
                      <li>• Action execution engine</li>
                      <li>• Supabase data persistence</li>
                    </ul>
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
              <CardTitle>Market Comparison</CardTitle>
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
                      <td className="p-2">Action Execution</td>
                      <td className="text-center p-2 text-green-600 font-medium">✅ YES</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Natural Language</td>
                      <td className="text-center p-2 text-green-600 font-medium">✅ YES</td>
                      <td className="text-center p-2 text-yellow-600">Limited</td>
                      <td className="text-center p-2 text-yellow-600">Limited</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Cost</td>
                      <td className="text-center p-2 text-green-600 font-medium">FREE</td>
                      <td className="text-center p-2 text-red-600">$50+/mo</td>
                      <td className="text-center p-2 text-red-600">$40+/mo</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Local Processing</td>
                      <td className="text-center p-2 text-green-600 font-medium">✅ YES</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
                    </tr>
                    <tr>
                      <td className="p-2">African Focus</td>
                      <td className="text-center p-2 text-green-600 font-medium">✅ YES</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
                      <td className="text-center p-2 text-red-600">❌ NO</td>
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
