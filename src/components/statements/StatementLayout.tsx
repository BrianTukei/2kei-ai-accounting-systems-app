
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { getLogo128 } from '@/utils/pdfLogo';

interface StatementLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  generatePDF: () => void;
}

export default function StatementLayout({ title, description, children, generatePDF }: StatementLayoutProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="compact-container bg-slate-50">
      <Navbar />
      
      <main className="compact-main px-2 sm:px-4">
        <div className="flex items-center mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="mr-3 hover:bg-slate-100"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="compact-text-2xl font-bold tracking-tight animate-fade-in">
              {title}
            </h1>
            <p className="text-slate-500 text-sm animate-fade-in">
              {description}
            </p>
          </div>
          
          <Button 
            className="mt-2 md:mt-0"
            onClick={generatePDF}
          >
            <Download className="h-3 w-3 mr-1" />
            PDF
          </Button>
        </div>
        
        <Card className="glass-card compact-card">
          <CardHeader className="pb-3">
            <CardTitle className="compact-text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </CardHeader>
          <CardContent className="compact-spacing">
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const generateBasePDF = async (title: string, content: any[][], summary: any[][]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add the logo
  let startY = 22;
  try {
    const logoDataUrl = await getLogo128();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 18, 18);
      startY = 14; // text starts beside logo
    }
  } catch { /* continue without logo */ }
  
  // Add company name beside logo
  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241); // indigo-500
  doc.text('2K AI Accounting Systems', 36, startY + 6);

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 38);
  
  // Add a subtitle with current date
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 46);
  
  // Add report data as a table
  autoTable(doc, {
    head: [content[0]],
    body: content.slice(1),
    startY: 52,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 249] }
  });
  
  // Add summary section if provided
  if (summary && summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text(`Summary`, 14, finalY + 15);
    
    autoTable(doc, {
      body: summary,
      startY: finalY + 20,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 }
    });
  }
  
  // Add footer with logo text
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      '2K AI Accounting Systems - This report contains confidential financial information.',
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Save the PDF
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  toast.success(`${title} has been downloaded`);
};

/** Format a value using the user's selected currency (from localStorage). */
export const formatCurrency = (value: number, currency?: string) => {
  if (!currency) {
    try {
      const stored = localStorage.getItem('selected-currency');
      if (stored) {
        const parsed = JSON.parse(stored);
        currency = parsed.code || 'USD';
      }
    } catch { /* ignore */ }
  }
  currency = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch (e) {
    return `${currency} ${value.toFixed(2)}`;
  }
};

/** Get the user's selected currency symbol from localStorage. */
export const getStoredCurrencySymbol = (): string => {
  try {
    const stored = localStorage.getItem('selected-currency');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.symbol || '$';
    }
  } catch { /* ignore */ }
  return '$';
};
