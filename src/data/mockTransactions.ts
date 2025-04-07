
import { Transaction } from '@/components/TransactionCard';

// Enhanced mock data for transactions
export const allTransactions: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Sales Revenue',
    description: 'Monthly product sales',
    date: 'Apr 05, 2025',
    metadata: {
      vendor: 'Various Customers',
      items: [
        { name: 'Product A', price: 1500, quantity: 1 },
        { name: 'Product B', price: 1000, quantity: 1 }
      ]
    }
  },
  {
    id: '2',
    amount: 1200,
    type: 'expense',
    category: 'Office Rent',
    description: 'Monthly office space rent',
    date: 'Apr 03, 2025',
    metadata: {
      vendor: 'Prime Properties Ltd',
      taxAmount: 150,
      subtotal: 1050
    }
  },
  {
    id: '3',
    amount: 750,
    type: 'expense',
    category: 'Utilities',
    description: 'Electricity and internet',
    date: 'Apr 02, 2025',
    metadata: {
      vendor: 'Power & Internet Co',
      items: [
        { name: 'Electricity', price: 450, quantity: 1 },
        { name: 'Internet', price: 300, quantity: 1 }
      ]
    }
  },
  {
    id: '4',
    amount: 3200,
    type: 'income',
    category: 'Client Payment',
    description: 'Project completion payment',
    date: 'Apr 01, 2025',
    metadata: {
      vendor: 'ABC Corporation',
      projectId: 'PROJ-2025-004'
    }
  },
  {
    id: '5',
    amount: 420,
    type: 'expense',
    category: 'Office Supplies',
    description: 'Stationery and equipment',
    date: 'Mar 30, 2025',
    metadata: {
      vendor: 'Office World',
      items: [
        { name: 'Notebooks', price: 120, quantity: 10 },
        { name: 'Pens', price: 50, quantity: 20 },
        { name: 'Whiteboard', price: 250, quantity: 1 }
      ]
    }
  },
  {
    id: '6',
    amount: 1800,
    type: 'income',
    category: 'Consulting Fee',
    description: 'Monthly retainer',
    date: 'Mar 28, 2025',
    metadata: {
      vendor: 'XYZ Ltd',
      invoiceNumber: 'INV-2025-016'
    }
  },
  {
    id: '7',
    amount: 350,
    type: 'expense',
    category: 'Marketing',
    description: 'Social media ads',
    date: 'Mar 25, 2025',
    metadata: {
      vendor: 'Social Boost Inc',
      campaignId: 'SMM-2025-Q1'
    }
  },
  {
    id: '8',
    amount: 75,
    type: 'expense',
    category: 'Subscription',
    description: 'Software subscription',
    date: 'Mar 22, 2025',
    metadata: {
      vendor: 'Cloud Services Pro',
      planType: 'Business',
      renewalPeriod: 'Monthly'
    }
  },
  {
    id: '9',
    amount: 4500,
    type: 'income',
    category: 'Project Payment',
    description: 'Website development project',
    date: 'Mar 20, 2025',
    metadata: {
      vendor: 'Global Enterprises',
      projectId: 'WEB-2025-002',
      milestoneNumber: 2
    }
  },
  {
    id: '10',
    amount: 890,
    type: 'expense',
    category: 'Equipment',
    description: 'New office chair',
    date: 'Mar 18, 2025',
    metadata: {
      vendor: 'Furniture Plus',
      warranty: '2 years',
      model: 'Ergonomic Pro X5'
    }
  },
  {
    id: '11',
    amount: 1200,
    type: 'income',
    category: 'Sales Revenue',
    description: 'Online store sales',
    date: 'Mar 15, 2025',
    metadata: {
      vendor: 'E-commerce Platform',
      orderCount: 16
    }
  },
  {
    id: '12',
    amount: 550,
    type: 'expense',
    category: 'Travel',
    description: 'Business trip to conference',
    date: 'Mar 12, 2025',
    metadata: {
      vendor: 'Various',
      items: [
        { name: 'Flight tickets', price: 300, quantity: 1 },
        { name: 'Hotel', price: 200, quantity: 1 },
        { name: 'Taxi', price: 50, quantity: 1 }
      ]
    }
  },
  {
    id: '13',
    amount: 2000,
    type: 'income',
    category: 'Investment Return',
    description: 'Quarterly dividend payment',
    date: 'Mar 10, 2025',
    metadata: {
      vendor: 'Investment Fund XYZ',
      accountNumber: 'INV-7890'
    }
  },
  {
    id: '14',
    amount: 180,
    type: 'expense',
    category: 'Meals',
    description: 'Business lunch with clients',
    date: 'Mar 08, 2025',
    metadata: {
      vendor: 'Gourmet Restaurant',
      attendees: 4
    }
  },
  {
    id: '15',
    amount: 5000,
    type: 'income',
    category: 'Loan',
    description: 'Business loan received',
    date: 'Mar 05, 2025',
    metadata: {
      vendor: 'First National Bank',
      loanNumber: 'LN-2025-003',
      interestRate: '5.2%'
    }
  }
];
