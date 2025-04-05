
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface ProfileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileUpload({ open, onOpenChange }: ProfileUploadProps) {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setProfileImage(event.target.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUploadSubmit = () => {
    if (profileImage) {
      // Save the user data with the profile image
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.profileImage = profileImage;
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Profile picture uploaded successfully!');
      onOpenChange(false);
      navigate('/dashboard');
    } else {
      toast.error('Please select an image to upload');
    }
  };

  const handleSkipUpload = () => {
    onOpenChange(false);
    navigate('/dashboard');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Profile Picture</DialogTitle>
          <DialogDescription>
            Personalize your account with a profile picture
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center gap-4">
            {profileImage ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                <img 
                  src={profileImage} 
                  alt="Profile Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="flex gap-2"
            >
              <Upload className="h-4 w-4" />
              Select Image
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSkipUpload}
          >
            Skip for now
          </Button>
          <Button 
            type="button" 
            onClick={handleProfileUploadSubmit}
            disabled={!profileImage}
          >
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
