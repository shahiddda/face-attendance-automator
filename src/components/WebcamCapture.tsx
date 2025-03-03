
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { detectFaces, recognizeFaces, markAttendance, getPeople, Person, AttendanceRecord } from '@/lib/face-api';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Clock, ScanFace } from 'lucide-react';

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
  const [recognitionInProgress, setRecognitionInProgress] = useState(false);
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  
  // Attendance confirmation popup
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && onCapture) {
      onCapture(imageSrc);
      setDetectionActive(false);
    }
  };

  // Simulates growing recognition confidence for better UX
  useEffect(() => {
    let confidenceInterval: NodeJS.Timeout | null = null;
    
    if (recognitionInProgress && recognitionConfidence < 100) {
      confidenceInterval = setInterval(() => {
        setRecognitionConfidence(prev => {
          const increment = Math.random() * 10 + 5; // Random increment between 5-15
          return Math.min(prev + increment, 100);
        });
      }, 300);
    } else if (!recognitionInProgress) {
      setRecognitionConfidence(0);
    }
    
    return () => {
      if (confidenceInterval) {
        clearInterval(confidenceInterval);
      }
    };
  }, [recognitionInProgress, recognitionConfidence]);

  useEffect(() => {
    let detectionInterval: NodeJS.Timeout | null = null;
    
    if (detectionActive && !captureMode && isCameraActive) {
      detectionInterval = setInterval(async () => {
        if (webcamRef.current && canvasRef.current) {
          try {
            const video = webcamRef.current.video;
            
            if (video && video.readyState === 4) {
              // Start recognition animation for better UX
              setRecognitionInProgress(true);
              
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
                      setRecognitionInProgress(false);
                      
                      if (onPersonDetected) {
                        onPersonDetected(person);
                      }
                      continue;
                    }
                    
                    // Only proceed to mark attendance if confidence is 100%
                    if (recognitionConfidence >= 100) {
                      // Mark attendance for recognized person
                      const attendanceResult = markAttendance(person.id, person.name);
                      
                      if (attendanceResult.success) {
                        setDetectedPersonName(person.name);
                        console.log(`Attendance marked for ${person.name}`);
                        
                        // Show confirmation popup and store attendance record
                        setAttendanceRecord(attendanceResult.record);
                        setShowConfirmation(true);
                        
                        // Turn off camera
                        setIsCameraActive(false);
                        setDetectionActive(false);
                        setRecognitionInProgress(false);
                        
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
                        setRecognitionInProgress(false);
                        
                        toast.warning(`Could not mark attendance for ${person.name}`, {
                          description: attendanceResult.error
                        });
                      }
                    } else {
                      // Still recognizing
                      setDetectedPersonName(`Recognizing ${person.name}...`);
                    }
                  } else {
                    setDetectedPersonName(null);
                    setRecognitionInProgress(false);
                  }
                }
              } else {
                setDetectedPersonName(null);
                setRecognitionInProgress(false);
              }
            }
          } catch (error) {
            console.error('Error in face detection:', error);
            toast.error('Face detection error');
            setRecognitionInProgress(false);
          }
        }
      }, 1000); // Run detection every second
    }
    
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [detectionActive, captureMode, onPersonDetected, isStudentApproved, isCameraActive, recognitionConfidence]);

  // Handler to restart the camera after attendance is confirmed
  const handleRestartCamera = () => {
    setShowConfirmation(false);
    setAttendanceRecord(null);
    setIsCameraActive(true);
    setDetectionActive(true);
    setRecognitionInProgress(false);
    setRecognitionConfidence(0);
  };

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
            
            {/* Recognition progress indicator */}
            {recognitionInProgress && (
              <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${recognitionConfidence}%` }}
                />
              </div>
            )}
            
            {/* Detected person name display */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                {recognitionInProgress && (
                  <ScanFace className="h-5 w-5 text-purple-400 animate-pulse" />
                )}
                <span className="text-lg font-medium">
                  {detectedPersonName ? detectedPersonName : 'No person detected'}
                </span>
              </div>
              {detectedPersonName && !detectedPersonName.includes('Not Approved') && 
               !detectedPersonName.includes('Cooldown') && !detectedPersonName.includes('Recognizing') && (
                <span className="inline-flex h-3 w-3 rounded-full bg-purple-500 animate-pulse" />
              )}
            </div>
            
            {/* Recognition overlay */}
            {recognitionInProgress && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-transparent animate-pulse">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-purple-500"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-purple-500"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-purple-500"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-purple-500"></div>
                </div>
              </div>
            )}
            
            {/* Buttons */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {captureMode && (
                <Button 
                  onClick={capture} 
                  variant="default" 
                  className="bg-purple-500 hover:bg-purple-600"
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
            : "Stand in front of the camera to mark your attendance. The system will recognize approved students automatically."}
        </p>
      </Card>

      {/* Attendance Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Attendance Marked Successfully
            </DialogTitle>
            <DialogDescription>
              Your attendance has been recorded in the system.
            </DialogDescription>
          </DialogHeader>

          {attendanceRecord && (
            <div className="p-4 border rounded-lg bg-background">
              <div className="mb-4 text-xl font-bold">{attendanceRecord.personName}</div>
              
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {new Date(attendanceRecord.timestamp).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {new Date(attendanceRecord.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="default" className="capitalize">
                  {attendanceRecord.status}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Button onClick={handleRestartCamera}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebcamCapture;
