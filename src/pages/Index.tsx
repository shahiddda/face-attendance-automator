
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WebcamCapture from '../components/WebcamCapture';
import PersonCard from '../components/PersonCard';
import AttendanceTable from '../components/AttendanceTable';
import RegisterPersonForm from '../components/RegisterPersonForm';
import { getPeople, getAttendanceRecords, addSampleData, Person, AttendanceRecord, loadModels } from '@/lib/face-api';
import { UserPlusIcon, Users, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recentDetections, setRecentDetections] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      try {
        // Initialize face-api models
        await loadModels();
        
        // Add sample data for demonstration
        addSampleData();
        
        // Get people and attendance records
        setPeople(getPeople());
        setRecords(getAttendanceRecords());
      } catch (error) {
        console.error('Error initializing page:', error);
        toast.error('Failed to initialize face detection. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePage();
  }, []);

  const handlePersonDetected = (person: Person) => {
    // Add to recent detections if not already there
    setRecentDetections(prev => {
      if (prev.some(p => p.id === person.id)) {
        return prev;
      }
      return [person, ...prev].slice(0, 5); // Keep only the 5 most recent
    });
    
    // Refresh attendance records
    setRecords(getAttendanceRecords());
  };

  const handlePersonRegistered = () => {
    // Refresh people list
    setPeople(getPeople());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Face Attendance System</h1>
          <p className="text-muted-foreground mt-2">
            Detect faces and mark attendance in real-time
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Webcam */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Face Detection</CardTitle>
                <CardDescription>
                  Turn on the camera to start detecting and recognizing faces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebcamCapture
                  onPersonDetected={handlePersonDetected}
                />
              </CardContent>
            </Card>

            {/* Recent Detections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Recently Detected
                </CardTitle>
                <CardDescription>
                  People who were recently detected by the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentDetections.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {recentDetections.map(person => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        attendance={{
                          status: 'present',
                          time: new Date().toLocaleTimeString()
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No faces detected yet. Turn on the camera and scan for faces.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Stats and Recent Activity */}
          <div>
            {/* Stats Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span>Registered People</span>
                    </div>
                    <span className="font-bold">{people.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span>Attendance Records</span>
                    </div>
                    <span className="font-bold">{records.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {records.length > 0 ? (
                  <AttendanceTable 
                    records={records.slice(0, 5)} 
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No attendance records yet
                  </div>
                )}
                
                {records.length > 5 && (
                  <div className="mt-4 text-right">
                    <Button variant="link" size="sm">
                      View all records
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Register New Person - Action Button */}
        <div className="fixed bottom-8 right-8">
          <Button 
            className="rounded-full w-12 h-12 p-0 shadow-lg"
            onClick={() => setShowRegisterForm(true)}
          >
            <UserPlusIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Register Person Form */}
        <RegisterPersonForm 
          isOpen={showRegisterForm}
          onClose={() => setShowRegisterForm(false)}
          onPersonRegistered={handlePersonRegistered}
        />
      </div>
    </div>
  );
};

export default Index;
