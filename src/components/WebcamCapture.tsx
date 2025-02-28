
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { detectFaces, recognizeFaces, markAttendance, Person, loadModels } from '@/lib/face-api';
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
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load models on component mount
  useEffect(() => {
    const initFaceApi = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
        console.log("Face models initialized in WebcamCapture");
      } catch (error) {
        console.error("Failed to initialize face models:", error);
        toast.error("Failed to initialize face detection. Some features may not work correctly.");
      }
    };
    
    initFaceApi();
  }, []);

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
    if (!webcamRef.current || !webcamRef.current.video || !isActive || isProcessing || !modelsLoaded) return;
    
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
        
        // Draw names on the canvas for recognized faces with a beautiful border
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
                
                // Create a beautiful glowing border around recognized faces
                ctx.strokeStyle = '#4ade80'; // Green color
                ctx.lineWidth = 4;
                ctx.shadowColor = '#4ade8080'; // Semi-transparent green
                ctx.shadowBlur = 15;
                ctx.strokeRect(drawBox.x, drawBox.y, drawBox.width, drawBox.height);
                
                // Reset shadow for the text
                ctx.shadowBlur = 0;
                
                // Create a more attractive name label with gradient
                const gradient = ctx.createLinearGradient(
                  drawBox.x, 
                  drawBox.y - 40, 
                  drawBox.x + drawBox.width, 
                  drawBox.y - 10
                );
                gradient.addColorStop(0, 'rgba(20, 184, 166, 0.9)'); // Teal
                gradient.addColorStop(1, 'rgba(74, 222, 128, 0.9)'); // Green
                
                // Draw name label with rounded corners
                const nameWidth = ctx.measureText(result.person.name).width + 20;
                const nameHeight = 30;
                const nameX = drawBox.x + (drawBox.width - nameWidth) / 2;
                const nameY = drawBox.y - 40;
                
                // Draw rounded rectangle for name background
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(nameX, nameY, nameWidth, nameHeight, 8);
                ctx.fill();
                
                // Add a subtle border to the name tag
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw name with shadow for better visibility
                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                ctx.fillText(result.person.name, nameX + nameWidth/2, nameY + nameHeight/2);
                
                // Reset shadow
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Add "Recognized!" text below the name
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '12px sans-serif';
                ctx.fillText('Recognized!', nameX + nameWidth/2, nameY + nameHeight + 15);
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
  }, [isActive, isProcessing, onPersonDetected, onRegisterMode, modelsLoaded]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !onRegisterMode && modelsLoaded) {
      interval = setInterval(processFaces, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, processFaces, onRegisterMode, modelsLoaded]);

  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <Card className="overflow-hidden">
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
                className="w-full h-full object-cover rounded-lg"
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
              
              {/* Display recognized persons */}
              {recognizedPersons.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/40 backdrop-blur-sm text-white px-4 py-2 rounded-lg animate-fade-in">
                  <div className="font-medium mb-1">Recognized Students:</div>
                  <div className="flex flex-wrap gap-2">
                    {recognizedPersons.map((person) => (
                      <span key={person.id} className="inline-flex items-center bg-emerald-500/70 px-2 py-1 rounded-full text-sm">
                        <UserCheckIcon className="w-3 h-3 mr-1" />
                        {person.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                disabled={isProcessing || !modelsLoaded}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Processing...' : 'Recognize Students'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebcamCapture;
