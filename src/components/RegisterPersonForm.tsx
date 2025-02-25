
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import WebcamCapture from './WebcamCapture';
import { registerPerson } from '@/lib/face-api';
import { UserIcon } from 'lucide-react';

interface RegisterPersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonRegistered: () => void;
}

const RegisterPersonForm: React.FC<RegisterPersonFormProps> = ({
  isOpen,
  onClose,
  onPersonRegistered
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };

  const handleRegister = async () => {
    if (!name || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!capturedImage || !imageRef.current) {
      toast.error('Please capture an image');
      return;
    }

    try {
      setIsRegistering(true);
      await registerPerson(name, role, imageRef.current);
      toast.success(`${name} has been registered successfully`);
      onPersonRegistered();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error registering person:', error);
      toast.error('Failed to register person');
    } finally {
      setIsRegistering(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setCapturedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New Person</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Employee, Student, etc."
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3 mt-2">
            <Label>Capture Face</Label>
            {capturedImage ? (
              <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => setCapturedImage(null)}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <WebcamCapture
                onRegisterMode={true}
                onCapture={handleCapture}
              />
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegister} 
            disabled={isRegistering || !capturedImage}
          >
            {isRegistering ? 'Registering...' : 'Register Person'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPersonForm;
