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
const ATTENDANCE_COOLDOWN_MS = 10000; // Changed from 30000 to 10000 (10 seconds cooldown)

// Mock implementation that doesn't require external models
export const loadModels = async () => {
  console.log('Using mock face recognition (no models required)');
  modelsLoaded = true;
  // Add sample data
  addSampleData();
  return true;
};

export const createFaceDescriptor = async (imageElement: HTMLImageElement): Promise<Float32Array[]> => {
  // Create a mock descriptor (would be a real descriptor in production)
  const mockDescriptor = new Float32Array(128);
  // Generate some random values to make each descriptor unique
  for (let i = 0; i < 128; i++) {
    mockDescriptor[i] = Math.random();
  }
  console.log('Created mock face descriptor');
  return [mockDescriptor];
};

export const detectFaces = async (
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement | null
): Promise<any[]> => {
  if (!canvas) return [];
  
  try {
    // Draw a mock detection on the canvas
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
      
      // Draw a mock detection box in the center
      const boxWidth = width / 3;
      const boxHeight = height / 3;
      const boxX = (width - boxWidth) / 2;
      const boxY = (height - boxHeight) / 2;
      
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    }
    
    // Return a mock detection result
    return [{
      detection: {
        box: {
          x: videoElement.videoWidth / 3,
          y: videoElement.videoHeight / 3,
          width: videoElement.videoWidth / 3,
          height: videoElement.videoHeight / 3
        }
      },
      descriptor: new Float32Array(128).fill(0.5)
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
  
  // For demo purposes: We'll improve the recognition rate for existing students
  // In a real app, this would use actual face recognition algorithms
  const recognitionProbability = 0.85; // 85% chance to recognize existing students
  
  return detections.map(detection => {
    if (Math.random() < recognitionProbability && people.length > 0) {
      // Randomly select a person from our database for the demo
      const randomIndex = Math.floor(Math.random() * people.length);
      return { person: people[randomIndex], detection };
    } else {
      return { person: null, detection };
    }
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

// For demonstration purposes, we'll add some sample data
export const addSampleData = () => {
  if (people.length === 0) {
    console.log("Adding sample people data");
    // Create dummy descriptors (all zeros) for sample people
    const dummyDescriptor = new Float32Array(128).fill(0);
    
    // This would typically come from a database
    people = [
      {
        id: 'person_1',
        name: 'Shahid Inamdar',
        role: 'Employee',
        descriptors: [dummyDescriptor], 
        image: '/placeholder.svg'
      }
    ];
    
    // Add some sample attendance records
    attendanceRecords = [
      {
        id: 'attendance_1',
        personId: 'person_1',
        personName: 'Shahid Inamdar',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'present'
      }
    ];
    
    // In a real application, we would retrieve the approved students from a database
    // For our mock implementation, we'll use the auth store to approve this sample student
    setTimeout(() => {
      const auth = useAuth.getState();
      if (auth && auth.approveStudent) {
        auth.approveStudent('person_1');
        console.log("Auto-approved sample student for demonstration");
      }
    }, 1000);
  }
};
