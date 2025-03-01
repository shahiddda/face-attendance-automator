
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { detectFaces, recognizeFaces, markAttendance, getPeople, Person } from '@/lib/face-api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

interface WebcamCaptureProps {
  onRegisterMode?: boolean;
  onCapture?: (imageSrc: string) => void;
  onPersonDetected?: (person: Person) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
  onRegisterMode = false,
  onCapture,
  onPersonDetected
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [detectionActive, setDetectionActive] = useState(!onRegisterMode);
  const [detectedPersonName, setDetectedPersonName] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState(onRegisterMode);
  const { isStudentApproved } = useAuth();
  
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && onCapture) {
      onCapture(imageSrc);
      setDetectionActive(false);
    }
  };

  useEffect(() => {
    let detectionInterval: NodeJS.Timeout | null = null;
    
    if (detectionActive && !captureMode) {
      detectionInterval = setInterval(async () => {
        if (webcamRef.current && canvasRef.current) {
          try {
            const video = webcamRef.current.video;
            
            if (video && video.readyState === 4) {
              // Run face detection
              const detections = await detectFaces(video, canvasRef.current);
              
              if (detections.length > 0) {
                // Recognize detected faces
                const recognitionResults = await recognizeFaces(detections);
                
                // Process the recognition results
                for (const result of recognitionResults) {
                  if (result.person) {
                    const person = result.person;
                    
                    // Check if student is approved before marking attendance
                    if (!isStudentApproved(person.id)) {
                      console.log(`${person.name} is not approved for attendance`);
                      setDetectedPersonName(`${person.name} (Not Approved)`);
                      if (onPersonDetected) {
                        onPersonDetected(person);
                      }
                      continue;
                    }
                    
                    // Mark attendance for recognized person
                    const attendanceResult = markAttendance(person.id, person.name);
                    
                    if (attendanceResult.success) {
                      setDetectedPersonName(person.name);
                      console.log(`Attendance marked for ${person.name}`);
                      
                      // Notify parent component about detected person
                      if (onPersonDetected) {
                        onPersonDetected(person);
                      }
                      
                      // Show toast message for successful attendance
                      toast.success(`Attendance marked for ${person.name}`, {
                        description: `Recorded at ${new Date().toLocaleTimeString()}`
                      });
                    } else if (attendanceResult.error) {
                      // Show warning toast for cooldown period
                      setDetectedPersonName(`${person.name} (Cooldown)`);
                      toast.warning(`Could not mark attendance for ${person.name}`, {
                        description: attendanceResult.error
                      });
                    }
                  } else {
                    setDetectedPersonName(null);
                  }
                }
              } else {
                setDetectedPersonName(null);
              }
            }
          } catch (error) {
            console.error('Error in face detection:', error);
            toast.error('Face detection error');
          }
        }
      }, 1000); // Run detection every second
    }
    
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [detectionActive, captureMode, onPersonDetected, isStudentApproved]);

  return (
    <div className="relative w-full">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {isCameraActive ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            
            {/* Detected person name display */}
            {detectedPersonName && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2 rounded-md flex items-center justify-between">
                <span className="text-lg font-medium">
                  {detectedPersonName}
                </span>
                {!detectedPersonName.includes('Not Approved') && !detectedPersonName.includes('Cooldown') && (
                  <span className="inline-flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            )}
            
            {/* Buttons */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {captureMode && (
                <Button 
                  onClick={capture} 
                  variant="default" 
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Capture
                </Button>
              )}
              
              <Button 
                onClick={() => setIsCameraActive(false)} 
                variant="outline" 
                className="bg-white/20 backdrop-blur-sm text-white border-white/20 hover:bg-white/30 hover:text-white"
              >
                Stop Camera
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-4 text-muted-foreground">Camera is turned off</p>
            <Button onClick={() => setIsCameraActive(true)}>
              Start Camera
            </Button>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <Card className="mt-4 p-4 dark:bg-gray-800/50 border border-border dark:border-gray-700">
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          {captureMode 
            ? "Position your face in the frame and click Capture"
            : "Stand in front of the camera to mark your attendance. Approved students will be recognized automatically."}
        </p>
      </Card>
    </div>
  );
};

export default WebcamCapture;
