
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { detectFaces, recognizeFaces, markAttendance, Person } from '@/lib/face-api';
import { CameraIcon, CameraOffIcon, UserCheckIcon, RefreshCwIcon, UserPlusIcon } from 'lucide-react';

interface WebcamCaptureProps {
  onPersonDetected?: (person: Person) => void;
  onRegisterMode?: boolean;
  onCapture?: (imageSrc: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
  onPersonDetected, 
  onRegisterMode = false,
  onCapture 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facesDetected, setFacesDetected] = useState(0);
  const [recognizedPersons, setRecognizedPersons] = useState<Person[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const toggleCamera = () => {
    setIsActive(prev => !prev);
    if (!isActive) {
      setRecognizedPersons([]);
    }
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc && onCapture) {
        onCapture(imageSrc);
        toast.success('Image captured successfully');
      }
    }
  }, [onCapture]);

  const processFaces = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video || !isActive || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const video = webcamRef.current.video;
      const detections = await detectFaces(video, canvasRef.current);
      
      setFacesDetected(detections.length);
      
      if (detections.length > 0 && !onRegisterMode) {
        const recognitionResults = await recognizeFaces(detections);
        
        const identified = recognitionResults
          .filter(result => result.person !== null)
          .map(result => result.person as Person);
        
        setRecognizedPersons(identified);
        
        // Draw names on the canvas for recognized faces
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            recognitionResults.forEach(result => {
              if (result.person) {
                const detection = result.detection;
                const box = detection.detection.box;
                const drawBox = {
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  height: box.height
                };
                
                // Draw border around face
                ctx.strokeStyle = '#4ade80'; // Green color
                ctx.lineWidth = 3;
                ctx.strokeRect(drawBox.x, drawBox.y, drawBox.width, drawBox.height);
                
                // Draw name label
                ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
                ctx.fillRect(drawBox.x, drawBox.y - 30, drawBox.width, 30);
                ctx.fillStyle = 'white';
                ctx.font = '16px sans-serif';
                ctx.fillText(result.person.name, drawBox.x + 5, drawBox.y - 10);
              }
            });
          }
        }
        
        if (identified.length > 0) {
          identified.forEach(person => {
            const record = markAttendance(person.id, person.name);
            toast.success(`Attendance marked for ${person.name}`, {
              description: new Date().toLocaleTimeString()
            });
            
            if (onPersonDetected) {
              onPersonDetected(person);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing faces:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isActive, isProcessing, onPersonDetected, onRegisterMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !onRegisterMode) {
      interval = setInterval(processFaces, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, processFaces, onRegisterMode]);

  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <Card className="overflow-hidden neomorphic-card">
      <CardContent className="p-0 relative">
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {isActive ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                className="w-full h-full object-cover rounded-lg transition-fade"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
              
              {/* Face count indicator */}
              <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {facesDetected > 0 ? (
                  <span className="flex items-center">
                    <UserCheckIcon className="w-4 h-4 mr-1" /> 
                    {facesDetected} {facesDetected === 1 ? 'face' : 'faces'} detected
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CameraIcon className="w-4 h-4 mr-1" /> Ready
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[480px] bg-gray-100 dark:bg-gray-800 rounded-lg">
              <CameraOffIcon className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">Camera is turned off</p>
            </div>
          )}
        </div>
        
        <div className="p-4 flex justify-between items-center">
          <Button 
            variant={isActive ? "destructive" : "default"}
            onClick={toggleCamera}
            className="transition-fade"
          >
            {isActive ? (
              <><CameraOffIcon className="w-4 h-4 mr-2" /> Turn Off</>
            ) : (
              <><CameraIcon className="w-4 h-4 mr-2" /> Turn On</>
            )}
          </Button>
          
          <div className="flex gap-2">
            {isActive && onRegisterMode && (
              <Button onClick={captureImage} variant="default">
                <UserPlusIcon className="w-4 h-4 mr-2" /> Capture
              </Button>
            )}
            
            {isActive && !onRegisterMode && (
              <Button 
                onClick={processFaces} 
                variant="outline"
                disabled={isProcessing}
              >
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Processing...' : 'Scan Now'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebcamCapture;
