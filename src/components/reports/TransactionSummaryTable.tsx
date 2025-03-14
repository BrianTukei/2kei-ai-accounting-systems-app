
import { Button } from '@/components/ui/button';

interface SummaryItem {
  category: string;
  month: string;
  amount: number;
}

interface TransactionSummaryTableProps {
  data: SummaryItem[];
  onGenerateFullReport: () => void;
}

export default function TransactionSummaryTable({ 
  data, 
  onGenerateFullReport 
}: TransactionSummaryTableProps) {
  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-2">Transaction Summary</h3>
      <p className="text-sm text-slate-500 mb-4">
        Overview of your recent financial activity
      </p>
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{item.category}</td>
              <td className="p-2">{item.month}</td>
              <td className={`p-2 text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-center">
        <Button variant="link" onClick={onGenerateFullReport}>
          View Full Report
        </Button>
      </div>
    </div>
  );
}
