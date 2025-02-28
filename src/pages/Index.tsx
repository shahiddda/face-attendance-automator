
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttendanceTable from '../components/AttendanceTable';
import RegisterPersonForm from '../components/RegisterPersonForm';
import { getPeople, getAttendanceRecords, loadModels, markAttendance, Person, AttendanceRecord } from '@/lib/face-api';
import { UserPlusIcon, Users, CalendarIcon, ListIcon } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Attendance Management System</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage attendance in real-time
          </p>
        </header>

        <Tabs defaultValue="attendance" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="attendance" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ListIcon className="mr-2 h-5 w-5" />
                    Attendance Records
                  </CardTitle>
                  <CardDescription>
                    View and manage attendance records by date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <p>Loading attendance data...</p>
                    </div>
                  ) : (
                    <AttendanceTable records={records} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="people">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {people.map(person => (
                <Card key={person.id}>
                  <CardHeader>
                    <CardTitle>{person.name}</CardTitle>
                    <CardDescription>{person.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAttendance(person, 'present')}
                      >
                        Mark Present
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleMarkAttendance(person, 'late')}
                      >
                        Mark Late
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {people.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground mb-4">No registered people yet</p>
                  <Button onClick={() => setShowRegisterForm(true)}>
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
