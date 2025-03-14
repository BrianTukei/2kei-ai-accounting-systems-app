
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ReportCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function ReportCard({
  title,
  description,
  buttonText,
  buttonIcon,
  onClick,
  isLoading = false,
  className = ""
}: ReportCardProps) {
  return (
    <div className={`p-6 border rounded-lg bg-white ${className}`}>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">
        {description}
      </p>
      <Button 
        onClick={onClick} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          "Generating..."
        ) : (
          <>
            {buttonIcon}
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}
