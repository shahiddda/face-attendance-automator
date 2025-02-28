
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttendanceTable from '../components/AttendanceTable';
import RegisterPersonForm from '../components/RegisterPersonForm';
import WebcamCapture from '../components/WebcamCapture';
import { getPeople, getAttendanceRecords, loadModels, markAttendance, Person, AttendanceRecord } from '@/lib/face-api';
import { UserPlusIcon, Users, CalendarIcon, ListIcon, UserIcon, UserCheckIcon, Clock10Icon, ScanSearchIcon } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showRecognitionMode, setShowRecognitionMode] = useState(false);
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

  // Function to manually mark attendance for testing purposes
  const handleMarkAttendance = (person: Person, status: 'present' | 'late' | 'absent' = 'present') => {
    markAttendance(person.id, person.name, status);
    setRecords(getAttendanceRecords());
    toast.success(`Marked ${person.name} as ${status}`);
  };

  const handleQuickRegister = () => {
    setShowRegisterForm(true);
    setShowRecognitionMode(false);
  };

  const handleRecognizeStudents = () => {
    setShowRecognitionMode(true);
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

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Attendance Management System</h1>
          <p className="text-muted-foreground mt-2 dark:text-gray-400">
            Track and manage attendance in real-time
          </p>
        </header>

        <div className="mb-6">
          <Card className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserCheckIcon className="h-6 w-6 text-accent dark:text-blue-400" />
                  <div>
                    <h3 className="font-medium text-foreground dark:text-white">Quick Attendance</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Mark attendance without navigating away</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    className="bg-accent hover:bg-accent/90 dark:bg-blue-600 dark:hover:bg-blue-700"
                    onClick={handleQuickRegister}
                  >
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                    New Student
                  </Button>
                  <Button 
                    variant="outline" 
                    className="dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white"
                    onClick={handleRecognizeStudents}
                  >
                    <ScanSearchIcon className="mr-2 h-4 w-4" />
                    Recognize Students
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showRecognitionMode && (
          <div className="mb-6 animate-fade-in">
            <Card className="dark:bg-gray-800 border-border dark:border-emerald-700 dark:border-2">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <ScanSearchIcon className="mr-2 h-5 w-5 text-emerald-500" />
                  Facial Recognition
                </CardTitle>
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

        <Tabs defaultValue="attendance" onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-secondary dark:bg-gray-700">
            <TabsTrigger value="attendance" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="grid grid-cols-1 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-foreground dark:text-white">
                    <ListIcon className="mr-2 h-5 w-5" />
                    Attendance Records
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    View and manage attendance records by date
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
          </TabsContent>
          
          <TabsContent value="people">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {people.map(person => (
                <Card key={person.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="dark:text-white">{person.name}</CardTitle>
                    <CardDescription className="dark:text-gray-400">{person.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-12 w-12 text-muted-foreground dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                        onClick={() => handleMarkAttendance(person, 'present')}
                      >
                        <UserCheckIcon className="mr-1 h-4 w-4" /> Present
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700"
                        onClick={() => handleMarkAttendance(person, 'late')}
                      >
                        <Clock10Icon className="mr-1 h-4 w-4" /> Late
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {people.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground dark:text-gray-400 mb-4">No registered people yet</p>
                  <Button 
                    onClick={() => setShowRegisterForm(true)}
                    className="dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Register New Person
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Register New Person - Action Button */}
        <div className="fixed bottom-8 right-8">
          <Button 
            className="rounded-full w-14 h-14 p-0 shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700"
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
