import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { CurrencyDisplay } from '@/components/currency/MultiCurrencyInput';

/**
 * Reports Page
 * Financial reports and analytics
 */
export default function Reports() {
  const { company } = useCompany();

  const reportTypes = [
    {
      title: 'Income Statement',
      description: 'Revenue, expenses, and profit overview',
      icon: TrendingUp,
      color: 'bg-blue-500',
      period: 'Monthly'
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: BarChart3,
      color: 'bg-green-500',
      period: 'Quarterly'
    },
    {
      title: 'Cash Flow',
      description: 'Operating, investing, and financing activities',
      icon: DollarSign,
      color: 'bg-purple-500',
      period: 'Monthly'
    },
    {
      title: 'Category Analysis',
      description: 'Spending by category breakdown',
      icon: PieChart,
      color: 'bg-orange-500',
      period: 'Custom'
    }
  ];

  const recentReports = [
    {
      name: 'January 2024 Income Statement',
      type: 'Income Statement',
      date: '2024-02-01',
      status: 'completed'
    },
    {
      name: 'Q4 2023 Balance Sheet',
      type: 'Balance Sheet',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      name: 'December 2023 Cash Flow',
      type: 'Cash Flow',
      date: '2024-01-05',
      status: 'completed'
    }
  ];

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Generate and analyze your financial reports</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter Reports
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Processing</p>
                <p className="text-2xl font-bold">2.3s</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">124MB</p>
              </div>
              <Download className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline">{report.period}</Badge>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  
                  <Button className="w-full">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
        <Card>
          <CardContent className="p-0">
            {recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generate your first financial report</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Report Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map((report, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-sm text-gray-500">
                              {company?.name}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{report.type}</Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Monthly Financial Summary</h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete monthly overview with all key metrics
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Use Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Tax Report</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tax-ready financial statements and deductions
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Use Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Investor Report</h3>
              <p className="text-sm text-gray-600 mb-3">
                Professional report for stakeholders and investors
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Use Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
