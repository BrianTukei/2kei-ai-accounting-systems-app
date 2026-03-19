/**
 * Workflow Automation Engine
 * ────────────────────────────────────────────────────────────────────────────
 * Intelligent automation system that creates, executes, and manages
 * financial workflows based on business rules and AI decisions.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { AIContext, AIAction } from './types';

// ── Workflow Types ─────────────────────────────────────────────────────────────

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'accounting' | 'reporting' | 'compliance' | 'optimization';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  schedule?: WorkflowSchedule;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number; // in minutes
  dependencies: string[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event_based' | 'data_driven';
  config: {
    event?: string;
    schedule?: string;
    dataCondition?: string;
    userAction?: string;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'decision' | 'approval' | 'notification' | 'calculation';
  config: StepConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  conditions?: StepCondition[];
}

export interface StepConfig {
  action?: string;
  parameters?: Record<string, any>;
  approvalRequired?: boolean;
  approvers?: string[];
  notification?: NotificationConfig;
  calculation?: CalculationConfig;
  decision?: DecisionConfig;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logic?: 'and' | 'or';
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logic?: 'and' | 'or';
}

export interface WorkflowSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timezone: string;
  nextRun: Date;
  lastRun?: Date;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
}

export interface NotificationConfig {
  type: 'email' | 'sms' | 'in_app' | 'webhook';
  recipients: string[];
  template: string;
  variables?: Record<string, any>;
}

export interface CalculationConfig {
  formula: string;
  variables: Record<string, any>;
  rounding?: number;
}

export interface DecisionConfig {
  condition: string;
  truePath: string;
  falsePath: string;
  defaultPath?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  currentStep: number;
  steps: StepExecution[];
  context: WorkflowContext;
  result?: WorkflowResult;
  error?: string;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
  attempts: number;
}

export interface WorkflowContext {
  variables: Record<string, any>;
  user: {
    id: string;
    role: string;
    permissions: string[];
  };
  organization: {
    id: string;
    settings: Record<string, any>;
  };
  triggerData?: any;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  data?: any;
  artifacts?: string[];
  nextActions?: string[];
}

// ── Predefined Workflows ─────────────────────────────────────────────────────────

const PREDEFINED_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'monthly_financial_close',
    name: 'Monthly Financial Close',
    description: 'Automated monthly financial closing process',
    category: 'accounting',
    trigger: {
      type: 'scheduled',
      config: { schedule: '0 9 1 * *' } // First day of month at 9 AM
    },
    steps: [
      {
        id: 'validate_data',
        name: 'Validate Financial Data',
        type: 'action',
        config: {
          action: 'validate_financial_data',
          parameters: { period: 'previous_month' }
        }
      },
      {
        id: 'generate_reports',
        name: 'Generate Financial Reports',
        type: 'action',
        config: {
          action: 'generate_financial_reports',
          parameters: { 
            reports: ['income_statement', 'balance_sheet', 'cash_flow'],
            period: 'previous_month'
          }
        }
      },
      {
        id: 'review_anomalies',
        name: 'Review for Anomalies',
        type: 'decision',
        config: {
          decision: {
            condition: 'anomalies_detected',
            truePath: 'handle_anomalies',
            falsePath: 'complete_close'
          }
        }
      },
      {
        id: 'notify_stakeholders',
        name: 'Notify Stakeholders',
        type: 'notification',
        config: {
          notification: {
            type: 'email',
            recipients: ['finance_team', 'management'],
            template: 'monthly_close_complete'
          }
        }
      }
    ],
    conditions: [],
    isActive: true,
    priority: 'high',
    estimatedTime: 30,
    dependencies: []
  },
  {
    id: 'expense_approval_workflow',
    name: 'Expense Approval Workflow',
    description: 'Automated expense approval based on amount and category',
    category: 'accounting',
    trigger: {
      type: 'event_based',
      config: { event: 'expense_submitted' }
    },
    steps: [
      {
        id: 'validate_expense',
        name: 'Validate Expense Data',
        type: 'action',
        config: {
          action: 'validate_expense',
          parameters: { check_duplicates: true, check_policy: true }
        }
      },
      {
        id: 'check_approval_required',
        name: 'Check Approval Required',
        type: 'decision',
        config: {
          decision: {
            condition: 'amount > 1000 OR category = "travel"',
            truePath: 'manager_approval',
            falsePath: 'auto_approve'
          }
        }
      },
      {
        id: 'manager_approval',
        name: 'Manager Approval',
        type: 'approval',
        config: {
          approvalRequired: true,
          approvers: ['manager'],
          notification: {
            type: 'email',
            recipients: ['manager'],
            template: 'expense_approval_request'
          }
        }
      },
      {
        id: 'process_payment',
        name: 'Process Payment',
        type: 'action',
        config: {
          action: 'process_expense_payment',
          parameters: { method: 'reimbursement' }
        }
      }
    ],
    conditions: [],
    isActive: true,
    priority: 'medium',
    estimatedTime: 15,
    dependencies: []
  },
  {
    id: 'cash_flow_monitoring',
    name: 'Cash Flow Monitoring',
    description: 'Continuous cash flow analysis and alerts',
    category: 'optimization',
    trigger: {
      type: 'data_driven',
      config: { dataCondition: 'cash_balance < threshold' }
    },
    steps: [
      {
        id: 'analyze_cash_position',
        name: 'Analyze Cash Position',
        type: 'calculation',
        config: {
          calculation: {
            formula: 'cash_balance / monthly_expenses',
            variables: { cash_balance: 'current', monthly_expenses: 'average_3m' }
          }
        }
      },
      {
        id: 'assess_risk_level',
        name: 'Assess Risk Level',
        type: 'decision',
        config: {
          decision: {
            condition: 'runway_months < 3',
            truePath: 'critical_alert',
            falsePath: 'monitoring_alert'
          }
        }
      },
      {
        id: 'generate_recommendations',
        name: 'Generate Recommendations',
        type: 'action',
        config: {
          action: 'generate_cash_flow_recommendations',
          parameters: { urgency: 'high' }
        }
      },
      {
        id: 'notify_management',
        name: 'Notify Management',
        type: 'notification',
        config: {
          notification: {
            type: 'email',
            recipients: ['cfo', 'ceo'],
            template: 'cash_flow_alert'
          }
        }
      }
    ],
    conditions: [],
    isActive: true,
    priority: 'critical',
    estimatedTime: 5,
    dependencies: []
  }
];

// ── Workflow Engine ─────────────────────────────────────────────────────────────

class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private executionQueue: WorkflowExecution[] = [];

  constructor() {
    this.initializeWorkflows();
  }

  private initializeWorkflows(): void {
    PREDEFINED_WORKFLOWS.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      ...definition,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
    triggerData?: any
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'pending',
      startedAt: new Date(),
      currentStep: 0,
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        attempts: 0
      })),
      context: {
        ...context,
        triggerData
      }
    };

    this.executions.set(execution.id, execution);
    this.executionQueue.push(execution);

    // Start execution asynchronously
    this.processExecution(execution.id);

    return execution;
  }

  /**
   * Process workflow execution
   */
  private async processExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    execution.status = 'running';

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepExecution = execution.steps[i];

        if (stepExecution.status === 'skipped') continue;

        execution.currentStep = i;
        stepExecution.status = 'running';
        stepExecution.startedAt = new Date();

        try {
          const result = await this.executeStep(step, execution.context);
          
          stepExecution.status = 'completed';
          stepExecution.completedAt = new Date();
          stepExecution.output = result;

          // Update context with step output
          if (result) {
            execution.context.variables[`${step.id}_result`] = result;
          }

        } catch (error) {
          stepExecution.status = 'failed';
          stepExecution.error = error.message;
          stepExecution.completedAt = new Date();

          // Handle retry logic
          if (step.retryPolicy && stepExecution.attempts < step.retryPolicy.maxAttempts) {
            stepExecution.attempts++;
            stepExecution.status = 'pending';
            i--; // Retry this step
            await this.delay(step.retryPolicy.initialDelay);
            continue;
          }

          // If no more retries, fail the workflow
          execution.status = 'failed';
          execution.error = `Step ${step.name} failed: ${error.message}`;
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.result = {
          success: true,
          message: 'Workflow completed successfully',
          data: execution.context.variables
        };
      }

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    switch (step.type) {
      case 'action':
        return this.executeAction(step.config, context);
      
      case 'decision':
        return this.executeDecision(step.config, context);
      
      case 'approval':
        return this.executeApproval(step.config, context);
      
      case 'notification':
        return this.executeNotification(step.config, context);
      
      case 'calculation':
        return this.executeCalculation(step.config, context);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAction(config: StepConfig, context: WorkflowContext): Promise<any> {
    // Mock action execution - in production, this would call actual services
    console.log(`Executing action: ${config.action}`, config.parameters);
    
    switch (config.action) {
      case 'validate_financial_data':
        return { valid: true, issues: [] };
      
      case 'generate_financial_reports':
        return { 
          reports: config.parameters?.reports || [],
          generatedAt: new Date()
        };
      
      case 'validate_expense':
        return { 
          valid: true, 
          duplicates: [], 
          policyViolations: []
        };
      
      case 'process_expense_payment':
        return { 
          paymentId: `pay_${Date.now()}`,
          status: 'processed'
        };
      
      default:
        return { executed: true };
    }
  }

  private async executeDecision(config: StepConfig, context: WorkflowContext): Promise<any> {
    // Mock decision logic - in production, this would evaluate actual conditions
    const decision = config.decision;
    
    console.log(`Evaluating decision: ${decision.condition}`);
    
    // Simple mock evaluation
    const result = Math.random() > 0.5 ? decision.truePath : decision.falsePath;
    
    return { decision: result, condition: decision.condition };
  }

  private async executeApproval(config: StepConfig, context: WorkflowContext): Promise<any> {
    // Mock approval process - in production, this would send approval requests
    console.log(`Requesting approval from: ${config.approvers?.join(', ')}`);
    
    return {
      approvalId: `approval_${Date.now()}`,
      status: 'pending',
      approvers: config.approvers
    };
  }

  private async executeNotification(config: StepConfig, context: WorkflowContext): Promise<any> {
    // Mock notification - in production, this would send actual notifications
    const notification = config.notification;
    
    console.log(`Sending ${notification.type} notification to: ${notification.recipients.join(', ')}`);
    
    return {
      notificationId: `notif_${Date.now()}`,
      sent: true,
      recipients: notification.recipients
    };
  }

  private async executeCalculation(config: StepConfig, context: WorkflowContext): Promise<any> {
    // Mock calculation - in production, this would evaluate actual formulas
    const calculation = config.calculation;
    
    console.log(`Executing calculation: ${calculation.formula}`);
    
    // Simple mock calculation
    const result = Math.random() * 100;
    
    return {
      formula: calculation.formula,
      result: result,
      rounded: calculation.rounding ? result.toFixed(calculation.rounding) : result
    };
  }

  /**
   * Get workflow execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all workflows
   */
  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow executions
   */
  getExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    return workflowId ? executions.filter(e => e.workflowId === workflowId) : executions;
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
    }
  }

  /**
   * Schedule workflow execution
   */
  async scheduleWorkflow(workflowId: string, schedule: WorkflowSchedule): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.schedule = schedule;
    
    // In production, this would integrate with a job scheduler
    console.log(`Scheduled workflow ${workflowId} for ${schedule.frequency} execution`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ── Export singleton instance ─────────────────────────────────────────────────

export const workflowEngine = new WorkflowEngine();
export default workflowEngine;
