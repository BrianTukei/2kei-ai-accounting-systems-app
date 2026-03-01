import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  DollarSign,
  PieChart,
  Lightbulb,
} from 'lucide-react';

interface AIInsightsPanelProps {
  className?: string;
  onAskAI?: (question: string) => void;
}

interface LocalInsight {
  id: string;
  title: string;
  body: string;
  tip: string;
  severity: 'info' | 'warning' | 'success';
  icon: React.ReactNode;
  question: string;
}

const LOCAL_INSIGHTS: LocalInsight[] = [
  {
    id: '1',
    title: 'Cash Flow Health',
    body: 'Positive cash flow is the lifeblood of any business. Ensure your accounts receivable are collected within 30 days and delay payables to 45–60 days where possible.',
    tip: 'Invoice immediately after delivering goods or services.',
    severity: 'info',
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    question: 'How can I improve my cash flow position?',
  },
  {
    id: '2',
    title: 'Expense Monitoring',
    body: 'Untracked expenses can quietly erode profitability. Review your expense categories monthly and flag any line item growing faster than revenue.',
    tip: 'Set a monthly budget alert at 80% of each expense category.',
    severity: 'warning',
    icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
    question: 'How do I track and reduce unnecessary business expenses?',
  },
  {
    id: '3',
    title: 'Profit Margin Insight',
    body: 'A healthy net profit margin for most small businesses is 10–20%. If yours is below 10%, identify whether the gap is in pricing, cost of goods, or overhead.',
    tip: 'Calculate gross margin first — if it\'s healthy but net margin is low, focus on operating expenses.',
    severity: 'success',
    icon: <DollarSign className="w-4 h-4 text-green-500" />,
    question: 'How do I analyze and improve my profit margin?',
  },
  {
    id: '4',
    title: 'Tax Preparation',
    body: 'Year-round tax preparation prevents last-minute surprises. Keep digital copies of all receipts and reconcile accounts monthly rather than annually.',
    tip: 'Set aside 25–30% of net profit quarterly for tax obligations.',
    severity: 'warning',
    icon: <PieChart className="w-4 h-4 text-purple-500" />,
    question: 'What are the best tax saving strategies for my business?',
  },
  {
    id: '5',
    title: 'Balance Sheet Strength',
    body: 'A strong balance sheet has more assets than liabilities. Aim for a current ratio above 2.0 (current assets / current liabilities).',
    tip: 'Reduce short-term debt and build a 3-month operating cash reserve.',
    severity: 'info',
    icon: <TrendingDown className="w-4 h-4 text-blue-400" />,
    question: 'How do I read and improve my balance sheet?',
  },
  {
    id: '6',
    title: 'Accounts Receivable',
    body: 'Outstanding invoices older than 60 days become difficult to collect. Send automated reminders at 30, 45, and 60 days past due.',
    tip: 'Offer a 2% early payment discount to incentivise prompt payment.',
    severity: 'warning',
    icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
    question: 'How do I manage overdue invoices and accounts receivable?',
  },
];

const severityStyles = {
  info: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
  warning: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20',
  success: 'border-green-200 bg-green-50/50 dark:bg-green-950/20',
};

const badgeStyles = {
  info: 'border-blue-300 text-blue-700 bg-blue-100 dark:text-blue-300',
  warning: 'border-orange-300 text-orange-700 bg-orange-100 dark:text-orange-300',
  success: 'border-green-300 text-green-700 bg-green-100 dark:text-green-300',
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ className, onAskAI }) => {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-primary" />
          AI Insights
          <Badge variant="secondary" className="ml-1 text-xs">{LOCAL_INSIGHTS.length} tips</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {LOCAL_INSIGHTS.map(insight => {
          const isOpen = expandedId === insight.id;
          return (
            <div
              key={insight.id}
              className={`rounded-lg border p-3 transition-all ${severityStyles[insight.severity]}`}
            >
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between gap-2 text-left"
                onClick={() => setExpandedId(isOpen ? null : insight.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {insight.icon}
                  <span className="text-sm font-medium truncate">{insight.title}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 hidden sm:inline-flex ${badgeStyles[insight.severity]}`}>
                    {insight.severity}
                  </Badge>
                </div>
                {isOpen
                  ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                }
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>
                  <div className="flex items-start gap-1.5 bg-background/60 rounded p-2 border border-border/40">
                    <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground font-medium">{insight.tip}</p>
                  </div>
                  {onAskAI && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs w-full text-primary hover:text-primary"
                      onClick={() => onAskAI(insight.question)}
                    >
                      Ask AI about this →
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

