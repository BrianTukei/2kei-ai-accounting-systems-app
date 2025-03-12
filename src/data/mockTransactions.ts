
import { Transaction } from '@/components/TransactionCard';

// Mock data for transactions
export const allTransactions: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Sales Revenue',
    description: 'Monthly product sales',
    date: 'Today'
  },
  {
    id: '2',
    amount: 1200,
    type: 'expense',
    category: 'Office Rent',
    description: 'Monthly office space rent',
    date: 'Yesterday'
  },
  {
    id: '3',
    amount: 750,
    type: 'expense',
    category: 'Utilities',
    description: 'Electricity and internet',
    date: '3 days ago'
  },
  {
    id: '4',
    amount: 3200,
    type: 'income',
    category: 'Client Payment',
    description: 'Project completion payment',
    date: '5 days ago'
  },
  {
    id: '5',
    amount: 420,
    type: 'expense',
    category: 'Office Supplies',
    description: 'Stationery and equipment',
    date: '1 week ago'
  },
  {
    id: '6',
    amount: 1800,
    type: 'income',
    category: 'Consulting Fee',
    description: 'Monthly retainer',
    date: '1 week ago'
  },
  {
    id: '7',
    amount: 350,
    type: 'expense',
    category: 'Marketing',
    description: 'Social media ads',
    date: '2 weeks ago'
  },
  {
    id: '8',
    amount: 75,
    type: 'expense',
    category: 'Subscription',
    description: 'Software subscription',
    date: '2 weeks ago'
  },
  {
    id: '9',
    amount: 4500,
    type: 'income',
    category: 'Project Payment',
    description: 'Website development project',
    date: '3 weeks ago'
  },
  {
    id: '10',
    amount: 890,
    type: 'expense',
    category: 'Equipment',
    description: 'New office chair',
    date: '3 weeks ago'
  },
];
