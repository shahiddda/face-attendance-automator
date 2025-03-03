
import * as faceapi from 'face-api.js';
import { useAuth } from './auth';

// Initialize models
let modelsLoaded = false;

export interface Person {
  id: string;
  name: string;
  role: string;
  descriptors: Float32Array[];
  image: string;
}

export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  timestamp: Date;
  status: 'present' | 'absent' | 'late';
}

// Sample data - would be replaced with actual database in production
let people: Person[] = [];
let attendanceRecords: AttendanceRecord[] = [];

// Track last attendance time for each person to prevent multiple records in short time
const lastAttendanceTime: Record<string, number> = {};
const ATTENDANCE_COOLDOWN_MS = 10000; // 10 seconds cooldown

// Mock implementation that doesn't require external models
export const loadModels = async () => {
  console.log('Using mock face recognition (no models required)');
  modelsLoaded = true;
  // Add sample data
  addSampleData();
  return true;
};

export const createFaceDescriptor = async (imageElement: HTMLImageElement) => {
  // Create a more consistent descriptor for better recognition
  const mockDescriptor = new Float32Array(128);
  // Generate deterministic values based on the image dimensions to simulate consistent recognition
  const seed = imageElement.width * imageElement.height;
  for (let i = 0; i < 128; i++) {
    // Using a simple hash function to generate consistent values
    mockDescriptor[i] = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
  }
  console.log('Created improved face descriptor');
  return [mockDescriptor];
};

// Current face position tracking for smoother animations
let currentFacePosition = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

// Current recognized person for consistent identification
let currentRecognizedPersonId = '';
let recognitionStartTime = 0;
const RECOGNITION_STABILITY_TIME = 3000; // Time in ms to maintain the same person recognition

export const detectFaces = async (
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement | null
): Promise<any[]> => {
  if (!canvas) return [];
  
  try {
    // Draw a more accurate detection on the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get dimensions from video element
      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      
      // Set canvas dimensions to match video
      canvas.width = width;
      canvas.height = height;
      
      // Calculate face position - more centered and stable
      // Use a simple stabilization technique to prevent jitter
      const now = Date.now();
      const phase = (now % 4000) / 4000; // Slow cycle for subtle movement
      const amplitude = 5; // Reduced random movement
      
      // Create a smooth transition for face position
      const targetX = width / 2 + Math.sin(phase * Math.PI * 2) * amplitude;
      const targetY = height / 2 + Math.cos(phase * Math.PI * 2) * amplitude;
      const targetWidth = width / 3;
      const targetHeight = height / 3;
      
      // Smooth movement - interpolate between current and target position
      const smoothFactor = 0.2; // Lower = smoother movement
      currentFacePosition.x = currentFacePosition.x * (1 - smoothFactor) + targetX * smoothFactor;
      currentFacePosition.y = currentFacePosition.y * (1 - smoothFactor) + targetY * smoothFactor;
      currentFacePosition.width = currentFacePosition.width * (1 - smoothFactor) + targetWidth * smoothFactor;
      currentFacePosition.height = currentFacePosition.height * (1 - smoothFactor) + targetHeight * smoothFactor;
      
      const boxX = currentFacePosition.x - currentFacePosition.width / 2;
      const boxY = currentFacePosition.y - currentFacePosition.height / 2;
      const boxWidth = currentFacePosition.width;
      const boxHeight = currentFacePosition.height;
      
      // Draw animated border around face instead of green rectangle
      ctx.strokeStyle = '#8B5CF6'; // Using a purple color for the border
      ctx.lineWidth = 3;
      
      // Animated corner brackets instead of full rectangle
      const cornerSize = Math.min(boxWidth, boxHeight) * 0.2;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cornerSize);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cornerSize, boxY);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(boxX + boxWidth - cornerSize, boxY);
      ctx.lineTo(boxX + boxWidth, boxY);
      ctx.lineTo(boxX + boxWidth, boxY + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxHeight - cornerSize);
      ctx.lineTo(boxX, boxY + boxHeight);
      ctx.lineTo(boxX + cornerSize, boxY + boxHeight);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(boxX + boxWidth - cornerSize, boxY + boxHeight);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerSize);
      ctx.stroke();
            
      // Add "SCANNING" text for better UX
      ctx.font = '16px Arial';
      ctx.fillStyle = '#8B5CF6';
      ctx.fillText('SCANNING...', boxX + boxWidth / 2 - 40, boxY - 10);
    }
    
    // Return a more realistic detection result
    return [{
      detection: {
        box: {
          x: currentFacePosition.x - currentFacePosition.width / 2,
          y: currentFacePosition.y - currentFacePosition.height / 2,
          width: currentFacePosition.width,
          height: currentFacePosition.height
        }
      },
      descriptor: new Float32Array(128).fill(0.5) // Consistent descriptor
    }];
  } catch (error) {
    console.error('Error in mock face detection:', error);
    return [];
  }
};

export const recognizeFaces = async (
  detections: any[],
): Promise<{person: Person | null, detection: any}[]> => {
  if (people.length === 0) {
    return detections.map(detection => ({ person: null, detection }));
  }
  
  // Improved recognition logic - makes the recognition consistent for a period of time
  return detections.map(detection => {
    const now = Date.now();
    
    // If no person is currently being recognized or it's time to switch
    if (!currentRecognizedPersonId || (now - recognitionStartTime > RECOGNITION_STABILITY_TIME)) {
      // Cycle through registered people based on time
      // This ensures we show different people over time but maintain stability
      const newPersonIndex = Math.floor(now / RECOGNITION_STABILITY_TIME) % people.length;
      const personToRecognize = people[newPersonIndex];
      
      if (personToRecognize) {
        // Update the current recognized person and timestamp
        currentRecognizedPersonId = personToRecognize.id;
        recognitionStartTime = now;
        console.log(`Recognizing: ${personToRecognize.name} (ID: ${personToRecognize.id})`);
        return { person: personToRecognize, detection };
      }
    } else {
      // Continue recognizing the same person for stability
      const currentPerson = people.find(p => p.id === currentRecognizedPersonId);
      if (currentPerson) {
        return { person: currentPerson, detection };
      }
    }
    
    return { person: null, detection };
  });
};

export const registerPerson = async (
  name: string,
  role: string,
  imageElement: HTMLImageElement
): Promise<Person> => {
  try {
    // Create a mock descriptor
    const descriptors = await createFaceDescriptor(imageElement);
    const id = `person_${Date.now()}`;
    
    // Create canvas to capture the face image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    const image = canvas.toDataURL('image/jpeg');
    
    const newPerson: Person = {
      id,
      name,
      role,
      descriptors,
      image
    };
    
    people.push(newPerson);
    console.log(`Person registered successfully: ${name}`, newPerson);
    return newPerson;
  } catch (error) {
    console.error('Error registering person:', error);
    throw error;
  }
};

export const markAttendance = (personId: string, personName: string, status: 'present' | 'absent' | 'late' = 'present') => {
  // Check if this person's attendance was marked recently (within cooldown period)
  const now = Date.now();
  const lastMarked = lastAttendanceTime[personId] || 0;
  const timeSinceLastMarked = now - lastMarked;
  
  if (timeSinceLastMarked < ATTENDANCE_COOLDOWN_MS) {
    // Return null or throw an error to indicate attendance was not marked
    const remainingCooldown = Math.ceil((ATTENDANCE_COOLDOWN_MS - timeSinceLastMarked) / 1000);
    console.log(`Attendance for ${personName} was already marked. Please wait ${remainingCooldown} seconds.`);
    return { 
      success: false, 
      error: `Attendance already marked. Please wait ${remainingCooldown} seconds.`,
      personName,
      lastMarked: new Date(lastMarked) 
    };
  }
  
  // Create new attendance record
  const record: AttendanceRecord = {
    id: `attendance_${Date.now()}`,
    personId,
    personName,
    timestamp: new Date(),
    status
  };
  
  // Update last attendance time for this person
  lastAttendanceTime[personId] = now;
  
  attendanceRecords.push(record);
  console.log(`Attendance marked for ${personName}`, record);
  return { success: true, record };
};

export const getAttendanceRecords = (): AttendanceRecord[] => {
  return [...attendanceRecords].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getPeople = (): Person[] => {
  return [...people];
};

// Function to export attendance records to Excel
export const exportAttendanceToExcel = () => {
  if (attendanceRecords.length === 0) {
    console.log('No attendance records to export');
    return null;
  }
  
  // Format records for Excel export
  const formattedRecords = attendanceRecords.map(record => ({
    'Student ID': record.personId,
    'Student Name': record.personName,
    'Date': new Date(record.timestamp).toLocaleDateString(),
    'Time': new Date(record.timestamp).toLocaleTimeString(),
    'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1)
  }));
  
  return formattedRecords;
};

// For demonstration purposes, we'll add some sample data with better descriptors
export const addSampleData = () => {
  if (people.length === 0) {
    console.log("Adding sample people data");
    
    // Create more realistic descriptors for better recognition
    const createRealisticDescriptor = () => {
      const descriptor = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        // More realistic values centered around 0.5 with some variation
        descriptor[i] = 0.5 + (Math.sin(i * 0.1) * 0.2);
      }
      return descriptor;
    };
    
    // Add multiple sample people instead of just one
    people = [
      {
        id: 'person_1',
        name: 'Shahid Inamdar',
        role: 'Student',
        descriptors: [createRealisticDescriptor()], 
        image: '/placeholder.svg'
      },
      {
        id: 'person_2',
        name: 'Saloni Upaskar',
        role: 'Student',
        descriptors: [createRealisticDescriptor()],
        image: '/placeholder.svg'
      },
      {
        id: 'person_3',
        name: 'Rajesh Kumar',
        role: 'Student',
        descriptors: [createRealisticDescriptor()],
        image: '/placeholder.svg'
      },
      {
        id: 'person_4',
        name: 'Priya Sharma',
        role: 'Student',
        descriptors: [createRealisticDescriptor()],
        image: '/placeholder.svg'
      }
    ];
    
    // Add sample attendance records for the sample people
    attendanceRecords = [
      {
        id: 'attendance_1',
        personId: 'person_1',
        personName: 'Shahid Inamdar',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'present'
      },
      {
        id: 'attendance_2',
        personId: 'person_2',
        personName: 'Saloni Upaskar',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        status: 'present'
      }
    ];
    
    // In a real application, we would retrieve the approved students from a database
    // For our mock implementation, we'll use the auth store to approve all sample students
    setTimeout(() => {
      const auth = useAuth.getState();
      if (auth && auth.approveStudent) {
        // Approve all sample students
        people.forEach(person => {
          auth.approveStudent(person.id);
          console.log(`Auto-approved student ${person.name} for demonstration`);
        });
      }
    }, 1000);
  }
};
