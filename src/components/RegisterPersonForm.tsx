
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import WebcamCapture from './WebcamCapture';
import { registerPerson, loadModels } from '@/lib/face-api';
import { UserIcon, ShieldIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { isAdmin } = useAuth();

  // Ensure models are loaded when the form opens
  useEffect(() => {
    if (isOpen && !modelsLoaded) {
      const loadFaceModels = async () => {
        try {
          await loadModels();
          setModelsLoaded(true);
          console.log("Face models loaded in registration form");
        } catch (error) {
          console.error("Failed to load face models:", error);
          toast.error("Failed to initialize face detection. Please try again.");
        }
      };
      
      loadFaceModels();
    }
  }, [isOpen, modelsLoaded]);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    console.log("Image captured successfully");
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
      console.log("Starting registration process for", name);
      
      // Ensure the image is fully loaded
      if (!imageRef.current.complete) {
        console.log("Waiting for image to load completely...");
        await new Promise(resolve => {
          imageRef.current!.onload = resolve;
        });
      }
      
      // Force a small delay to ensure image is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await registerPerson(name, role, imageRef.current);
      
      // If admin is logged in, automatically approve the newly registered student
      if (isAdmin) {
        const { approveStudent } = useAuth.getState();
        // We don't know the exact ID assigned during registration, so we'll refresh the page to get it later
        toast.success(`${name} has been registered and automatically approved by admin`);
      } else {
        toast.success(`${name} has been registered successfully. Admin approval pending.`);
      }
      
      onPersonRegistered();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error registering person:', error);
      toast.error('Failed to register person. Please try again.');
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
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Register New Person</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Add a new person to the face recognition system
            {!isAdmin && (
              <p className="mt-2 text-amber-500 text-xs">
                Note: Approval from an admin is required before you can mark attendance
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="name" className="dark:text-gray-300">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Label htmlFor="role" className="dark:text-gray-300">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Employee, Student, etc."
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3 mt-2">
            <Label className="dark:text-gray-300">Capture Face</Label>
            {capturedImage ? (
              <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
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
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="mr-auto">
            {!isAdmin && (
              <Link to="/admin-login" className="text-sm flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                <ShieldIcon className="h-3 w-3" />
                Admin Login
              </Link>
            )}
          </div>
          <Button variant="outline" onClick={onClose} className="dark:text-gray-300 dark:border-gray-600">
            Cancel
          </Button>
          <Button 
            onClick={handleRegister} 
            disabled={isRegistering || !capturedImage}
            className="dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isRegistering ? 'Registering...' : 'Register Person'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPersonForm;
