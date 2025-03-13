
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface StatementLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  generatePDF: () => void;
}

export default function StatementLayout({ title, description, children, generatePDF }: StatementLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
              {title}
            </h1>
            <p className="text-slate-500 animate-fade-in">
              {description}
            </p>
          </div>
          
          <Button 
            className="mt-4 md:mt-0"
            onClick={generatePDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
        
        <Card className="glass-card glass-card-hover">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export const generateBasePDF = (title: string, content: any[][], summary: any[][]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add a title
  doc.setFontSize(20);
  doc.text(`${title}`, 14, 22);
  
  // Add a subtitle with current date
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add a company logo or name
  doc.setFontSize(16);
  doc.text('2KÉI Ledgery', 14, 45);
  
  // Add report data as a table
  autoTable(doc, {
    head: [content[0]],
    body: content.slice(1),
    startY: 55,
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
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      '2KÉI Ledgery - This report contains confidential financial information.',
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
