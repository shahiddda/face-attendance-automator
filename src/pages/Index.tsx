import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttendanceTable from '../components/AttendanceTable';
import RegisterPersonForm from '../components/RegisterPersonForm';
import WebcamCapture from '../components/WebcamCapture';
import AttendanceAnalysis from '../components/AttendanceAnalysis';
import { getPeople, getAttendanceRecords, loadModels, markAttendance, Person, AttendanceRecord } from '@/lib/face-api';
import { UserPlusIcon, Users, CalendarIcon, ListIcon, UserIcon, UserCheckIcon, BarChart2Icon } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showRecognitionMode, setShowRecognitionMode] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      try {
        // Initialize face-api models
        console.log("Initializing face-api models");
        await loadModels();
        
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

  const handlePersonRegistered = () => {
    console.log("Person registered, refreshing people list");
    // Refresh people list
    setPeople(getPeople());
  };

  const handleMarkAttendance = (person: Person, status: 'present' | 'late' | 'absent' = 'present') => {
    const result = markAttendance(person.id, person.name, status);
    if (result.success) {
      setRecords(getAttendanceRecords());
      toast.success(`Marked ${person.name} as ${status}`);
    } else {
      toast.warning(`Could not mark attendance for ${person.name}`, {
        description: result.error
      });
    }
  };

  const handleQuickRegister = () => {
    setShowRegisterForm(true);
    setShowRecognitionMode(false);
    setShowAnalysis(false);
  };

  const handleRecognizeStudents = () => {
    setShowRecognitionMode(true);
    setShowRegisterForm(false);
    setShowAnalysis(false);
  };

  const handleShowAnalysis = () => {
    setShowAnalysis(true);
    setShowRecognitionMode(false);
    setShowRegisterForm(false);
  };

  const handlePersonDetected = (person: Person) => {
    // Refresh records after detection
    setRecords(getAttendanceRecords());
    // Give it a bit of time for the animation
    setTimeout(() => {
      setActiveTab("attendance");
    }, 1000);
  };

  // Reset all panels display
  const handleResetDisplay = () => {
    setShowRecognitionMode(false);
    setShowRegisterForm(false);
    setShowAnalysis(false);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Attendance Management System</h1>
          <p className="text-muted-foreground mt-2 dark:text-gray-400">
            Track and manage attendance in real-time
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Mark Attendance Card */}
          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
            onClick={handleRecognizeStudents}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <UserCheckIcon className="mr-2 h-6 w-6 text-green-500" />
                Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                Recognize students and mark their attendance automatically
              </p>
              <Button 
                className="w-full dark:bg-green-600 dark:hover:bg-green-700"
                onClick={handleRecognizeStudents}
              >
                Open Camera
              </Button>
            </CardContent>
          </Card>

          {/* Add New Student Card */}
          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
            onClick={handleQuickRegister}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <UserPlusIcon className="mr-2 h-6 w-6 text-blue-500" />
                Add New Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                Register new students to the system with facial recognition
              </p>
              <Button 
                className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={handleQuickRegister}
              >
                Register Student
              </Button>
            </CardContent>
          </Card>

          {/* Analyze Attendance Card */}
          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
            onClick={handleShowAnalysis}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <BarChart2Icon className="mr-2 h-6 w-6 text-purple-500" />
                Analyze Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                View attendance statistics and trends with graphical analysis
              </p>
              <Button 
                className="w-full dark:bg-purple-600 dark:hover:bg-purple-700"
                onClick={handleShowAnalysis}
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Panel Section */}
        {showRecognitionMode && (
          <div className="mb-6 animate-fade-in">
            <Card className="dark:bg-gray-800 border-border dark:border-green-700 dark:border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center dark:text-white">
                    <UserCheckIcon className="mr-2 h-5 w-5 text-green-500" />
                    Facial Recognition
                  </CardTitle>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleResetDisplay}>
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <CardDescription className="dark:text-gray-400">
                  Recognize and mark attendance for existing students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WebcamCapture 
                  onPersonDetected={handlePersonDetected}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {showRegisterForm && (
          <div className="mb-6 animate-fade-in">
            <Card className="dark:bg-gray-800 border-border dark:border-blue-700 dark:border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center dark:text-white">
                    <UserPlusIcon className="mr-2 h-5 w-5 text-blue-500" />
                    Register New Student
                  </CardTitle>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowRegisterForm(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <CardDescription className="dark:text-gray-400">
                  Add a new student to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterPersonForm 
                  isOpen={true}
                  onClose={() => setShowRegisterForm(false)}
                  onPersonRegistered={handlePersonRegistered}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {showAnalysis && (
          <div className="mb-6 animate-fade-in">
            <Card className="dark:bg-gray-800 border-border dark:border-purple-700 dark:border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center dark:text-white">
                    <BarChart2Icon className="mr-2 h-5 w-5 text-purple-500" />
                    Attendance Analysis
                  </CardTitle>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowAnalysis(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <CardDescription className="dark:text-gray-400">
                  View attendance statistics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceAnalysis records={records} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Only show attendance table if no other panel is active */}
        {!showRecognitionMode && !showRegisterForm && !showAnalysis && (
          <div className="animate-fade-in">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground dark:text-white">
                  <ListIcon className="mr-2 h-5 w-5" />
                  Recent Attendance Records
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  View the most recent attendance entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="dark:text-gray-300">Loading attendance data...</p>
                  </div>
                ) : (
                  <AttendanceTable records={records} className="dark:text-gray-300" />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Watermark */}
        <div className="mt-12 text-center opacity-60 text-sm text-muted-foreground dark:text-gray-500">
          <p className="font-light italic">
            Project developed by <span className="font-medium">Shahid Inamdar</span> and <span className="font-medium">Saloni Upaskar</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
