
import * as faceapi from 'face-api.js';

// Initialize models
let modelsLoaded = false;
const MODEL_URL = '/models';

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

export const loadModels = async () => {
  if (modelsLoaded) return;
  
  try {
    // Load models directly as browser paths
    await faceapi.loadSsdMobilenetv1Model('/models');
    await faceapi.loadFaceLandmarkModel('/models');
    await faceapi.loadFaceRecognitionModel('/models');
    await faceapi.loadFaceExpressionModel('/models');
    
    console.log('Face-API models loaded successfully');
    modelsLoaded = true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
};

export const createFaceDescriptor = async (imageElement: HTMLImageElement): Promise<Float32Array[]> => {
  if (!modelsLoaded) await loadModels();
  
  try {
    const detection = await faceapi.detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      throw new Error('No face detected in the image');
    }
    
    return [detection.descriptor];
  } catch (error) {
    console.error('Error creating face descriptor:', error);
    throw error;
  }
};

export const detectFaces = async (
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement | null
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[]> => {
  if (!modelsLoaded) await loadModels();
  if (!canvas) return [];
  
  try {
    const detections = await faceapi.detectAllFaces(videoElement)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    const dimensions = faceapi.matchDimensions(canvas, videoElement, true);
    const resizedDetections = faceapi.resizeResults(detections, dimensions);
    
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw face detections
      faceapi.draw.drawDetections(canvas, resizedDetections);
    }
    
    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
};

export const recognizeFaces = async (
  detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[],
  threshold = 0.6
): Promise<{person: Person | null, detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>}[]> => {
  const results = detections.map(detection => {
    if (people.length === 0) return { person: null, detection };
    
    // Create a face matcher with our registered people
    const labeledDescriptors = people.map(person => 
      new faceapi.LabeledFaceDescriptors(
        person.id, 
        person.descriptors.map(desc => new Float32Array(desc))
      )
    );
    
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);
    
    // Find best match
    const match = faceMatcher.findBestMatch(detection.descriptor);
    
    if (match.label === 'unknown') {
      return { person: null, detection };
    }
    
    const matchedPerson = people.find(p => p.id === match.label) || null;
    return { person: matchedPerson, detection };
  });
  
  return results;
};

export const registerPerson = async (
  name: string,
  role: string,
  imageElement: HTMLImageElement
): Promise<Person> => {
  try {
    if (!modelsLoaded) await loadModels();
    
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
    console.log(`Person registered: ${name}`, newPerson);
    return newPerson;
  } catch (error) {
    console.error('Error registering person:', error);
    throw error;
  }
};

export const markAttendance = (personId: string, personName: string, status: 'present' | 'absent' | 'late' = 'present') => {
  const record: AttendanceRecord = {
    id: `attendance_${Date.now()}`,
    personId,
    personName,
    timestamp: new Date(),
    status
  };
  
  attendanceRecords.push(record);
  return record;
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
    // This would typically come from a database
    people = [
      {
        id: 'person_1',
        name: 'John Doe',
        role: 'Employee',
        descriptors: [], // Would contain actual descriptors
        image: '/placeholder.svg'
      },
      {
        id: 'person_2',
        name: 'Jane Smith',
        role: 'Manager',
        descriptors: [], // Would contain actual descriptors
        image: '/placeholder.svg'
      }
    ];
    
    // Add some sample attendance records
    attendanceRecords = [
      {
        id: 'attendance_1',
        personId: 'person_1',
        personName: 'John Doe',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'present'
      },
      {
        id: 'attendance_2',
        personId: 'person_2',
        personName: 'Jane Smith',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        status: 'present'
      }
    ];
  }
};
