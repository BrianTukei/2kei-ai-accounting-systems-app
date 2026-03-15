import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Zap, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Brain,
  MessageSquare,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Shield,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import LocalAIChatbot from '@/components/LocalAIChatbot';
import { localAIService } from '@/services/ai/localAIService';

export default function LocalAIAssistant() {
  const [activeTab, setActiveTab] = useState('chat');
  const [serviceInfo, setServiceInfo] = useState(localAIService.getServiceInfo());
  const [isCheckingService, setIsCheckingService] = useState(false);

  const checkServiceStatus = async () => {
    setIsCheckingService(true);
    try {
      const available = await localAIService.isServiceAvailable();
      setServiceInfo(localAIService.getServiceInfo());
      
      if (available) {
        toast.success('✅ Local AI service is running!');
      } else {
        toast.warning('⚠️ Local AI service is not available');
      }
    } catch (error) {
      console.error('Failed to check service:', error);
      toast.error('Failed to check service status');
    } finally {
      setIsCheckingService(false);
    }
  };

  const installOllama = () => {
    window.open('https://ollama.com', '_blank');
    toast.info('Opening Ollama download page in new tab');
  };

  const pullLlamaModel = async () => {
    try {
      toast.info('Downloading Llama 3 model... This may take a few minutes.');
      await localAIService.pullModel('llama3');
      toast.success('✅ Llama 3 model downloaded successfully!');
      setServiceInfo(localAIService.getServiceInfo());
    } catch (error) {
      console.error('Failed to pull model:', error);
      toast.error('Failed to download Llama 3 model');
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: 'AI-Powered Receipt Scanning',
      description: 'Automatically extract merchant, date, items, and amounts from receipt images using advanced OCR.',
      category: 'Core Features'
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      title: 'Multi-Currency Support',
      description: 'Support for 30+ currencies including UGX, KES, TZS, RWF with automatic conversion.',
      category: 'Core Features'
    },
    {
      icon: <FileText className="h-8 w-8 text-purple-500" />,
      title: 'Smart PDF Generation',
      description: 'Generate professional PDFs with company branding and custom templates.',
      category: 'Core Features'
    },
    {
      icon: <Users className="h-8 w-8 text-orange-500" />,
      title: 'Team Collaboration',
      description: 'Manage users, permissions, and collaborate on financial data securely.',
      category: 'Management'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-red-500" />,
      title: 'Financial Analytics',
      description: 'Get insights, reports, and analytics to make informed business decisions.',
      category: 'Analytics'
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-500" />,
      title: 'Privacy-First',
      description: 'All AI processing happens locally on your machine. No data leaves your system.',
      category: 'Security'
    }
  ];

  const setupSteps = [
    {
      step: 1,
      title: 'Install Ollama',
      description: 'Download and install Ollama from the official website.',
      action: 'Download',
      icon: <Download className="h-5 w-5" />,
      command: 'Visit https://ollama.com'
    },
    {
      step: 2,
      title: 'Run Llama Model',
      description: 'Pull and run the Llama 3 model locally.',
      action: 'Run Command',
      icon: <Terminal className="h-5 w-5" />,
      command: 'ollama run llama3'
    },
    {
      step: 3,
      title: 'Start Chatting',
      description: 'Begin using your AI assistant with zero costs!',
      action: 'Start Chat',
      icon: <MessageSquare className="h-5 w-5" />,
      command: 'Open chat interface'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-500" />
            Local AI Assistant
          </h1>
          <p className="text-gray-600">
            Powerful AI assistance running locally on your machine - 100% free!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={serviceInfo.isAvailable ? 'default' : 'secondary'}>
            {serviceInfo.isAvailable ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          <Button variant="outline" onClick={checkServiceStatus} disabled={isCheckingService}>
            <Settings className="h-4 w-4 mr-2" />
            {isCheckingService ? 'Checking...' : 'Check Status'}
          </Button>
        </div>
      </div>

      {/* Service Status Card */}
      <Card className={serviceInfo.isAvailable ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                serviceInfo.isAvailable ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {serviceInfo.isAvailable ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {serviceInfo.isAvailable ? '✅ Local AI is Running' : '⚠️ Setup Required'}
                </h3>
                <p className="text-sm text-gray-600">
                  {serviceInfo.isAvailable 
                    ? `Connected to ${serviceInfo.defaultModel} at ${serviceInfo.baseUrl}`
                    : 'Install Ollama to enable free AI assistance'
                  }
                </p>
              </div>
            </div>
            {!serviceInfo.isAvailable && (
              <div className="flex gap-2">
                <Button onClick={installOllama}>
                  <Download className="h-4 w-4 mr-2" />
                  Install Ollama
                </Button>
                <Button variant="outline" onClick={pullLlamaModel}>
                  <Download className="h-4 w-4 mr-2" />
                  Get Llama 3
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="setup">
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="about">
            <Brain className="h-4 w-4 mr-2" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="h-[600px]">
            <LocalAIChatbot />
          </div>
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Setup Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {setupSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{step.step}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {step.command}
                          </code>
                          <Button size="sm" variant="outline">
                            {step.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Minimum Requirements</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 8GB RAM</li>
                      <li>• 10GB free disk space</li>
                      <li>• Modern CPU (Intel/AMD)</li>
                      <li>• Windows/macOS/Linux</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recommended</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 16GB+ RAM</li>
                      <li>• 20GB+ free disk space</li>
                      <li>• Multi-core CPU</li>
                      <li>• SSD storage</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    {feature.icon}
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    <Badge variant="secondary">{feature.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  About Local AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🚀 Why Local AI?</h3>
                  <p className="text-gray-600">
                    Our Local AI Assistant runs entirely on your machine using Ollama and Llama 3. 
                    This means:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>✅ Zero API costs - completely free</li>
                    <li>🔒 Maximum privacy - no data leaves your system</li>
                    <li>⚡ Fast responses - no network latency</li>
                    <li>🌙 Works offline - no internet required</li>
                    <li>🎯 Customized for accounting - specialized knowledge</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🧠 AI Capabilities</h3>
                  <p className="text-gray-600">
                    The AI assistant is trained to help with all aspects of 2K AI Accounting Systems:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                    <li>🧾 Receipt scanning and data extraction guidance</li>
                    <li>💱 Currency conversion and multi-currency support</li>
                    <li>📊 Financial reporting and analytics</li>
                    <li>👥 Team management and collaboration</li>
                    <li>📄 Invoice creation and customization</li>
                    <li>🎯 Platform navigation and feature discovery</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Be specific in your questions for better answers</li>
                    <li>Use the quick actions for common tasks</li>
                    <li>Ask for step-by-step guidance when learning</li>
                    <li>Request help with specific features you're exploring</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔧 Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Technology Stack</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Model: Llama 3 (Meta)</li>
                      <li>• Runtime: Ollama</li>
                      <li>• Interface: REST API</li>
                      <li>• Integration: Local HTTP calls</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Response time: 2-5 seconds</li>
                      <li>• Memory usage: 4-8GB RAM</li>
                      <li>• Model size: ~5GB</li>
                      <li>• Accuracy: High for accounting tasks</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
