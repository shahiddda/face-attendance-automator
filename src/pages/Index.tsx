import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AttendanceTable from '../components/AttendanceTable';
import RegisterPersonForm from '../components/RegisterPersonForm';
import WebcamCapture from '../components/WebcamCapture';
import AttendanceAnalysis from '../components/AttendanceAnalysis';
import { getPeople, getAttendanceRecords, loadModels, markAttendance, Person, AttendanceRecord } from '@/lib/face-api';
import { UserPlusIcon, Users, CalendarIcon, ListIcon, UserIcon, UserCheckIcon, BarChart2Icon, ShieldIcon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const Index = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showRecognitionMode, setShowRecognitionMode] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const [darkMode, setDarkMode] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Person | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const { isAdmin, isStudentApproved, requestLeave, getStudentLeaveRequests } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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
        console.log("Initializing face-api models");
        await loadModels();
        
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
    setPeople(getPeople());
    toast.info('New student registration needs admin approval before they can mark attendance');
  };

  const handleMarkAttendance = (person: Person, status: 'present' | 'late' | 'absent' = 'present') => {
    if (!isStudentApproved(person.id)) {
      toast.error(`${person.name} is not approved to mark attendance`, {
        description: "Contact an administrator for approval."
      });
      return;
    }
    
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
    if (!isAdmin) {
      toast.info("Your registration will require admin approval before you can mark attendance.", {
        description: "Contact an administrator after registration."
      });
    }
    
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
    if (!isStudentApproved(person.id)) {
      toast.error(`${person.name} is not approved to mark attendance`, {
        description: "Contact an administrator for approval."
      });
      return;
    }
    
    setRecords(getAttendanceRecords());
    setTimeout(() => {
      setActiveTab("attendance");
    }, 1000);
  };

  const handleResetDisplay = () => {
    setShowRecognitionMode(false);
    setShowRegisterForm(false);
    setShowAnalysis(false);
  };

  const handleOpenLeaveForm = (person: Person) => {
    setSelectedStudent(person);
    setShowLeaveForm(true);
  };

  const handleCloseLeaveForm = () => {
    setShowLeaveForm(false);
    setSelectedStudent(null);
    setLeaveReason('');
    setFromDate('');
    setToDate('');
  };

  const handleSubmitLeaveRequest = () => {
    if (!selectedStudent) {
      toast.error("No student selected");
      return;
    }
    
    if (!leaveReason || !fromDate || !toDate) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const requestId = requestLeave(
      selectedStudent.id,
      selectedStudent.name,
      leaveReason,
      fromDate,
      toDate
    );
    
    toast.success("Leave request submitted successfully", {
      description: "An administrator will review your request."
    });
    
    handleCloseLeaveForm();
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Attendance Management System</h1>
            <p className="text-muted-foreground mt-2 dark:text-gray-400">
              Track and manage attendance in real-time
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {isAdmin ? (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/admin-dashboard')}
              >
                <ShieldIcon className="h-4 w-4" />
                Admin Dashboard
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate('/admin-login')}
              >
                <ShieldIcon className="h-4 w-4" />
                Admin Login
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <CalendarIcon className="mr-2 h-6 w-6 text-orange-500" />
                Request Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                Submit a leave request to be approved by administrators
              </p>
              <div className="w-full">
                {people.length > 0 ? (
                  <select 
                    className="w-full p-2 bg-background dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mb-2 text-foreground dark:text-gray-200"
                    onChange={(e) => {
                      const selectedPerson = people.find(p => p.id === e.target.value);
                      if (selectedPerson) {
                        handleOpenLeaveForm(selectedPerson);
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>Select your name</option>
                    {people.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-center dark:text-gray-400 mb-2">
                    No students registered yet
                  </p>
                )}
                <Button 
                  className="w-full dark:bg-orange-600 dark:hover:bg-orange-700"
                  disabled={people.length === 0}
                  onClick={() => {
                    if (people.length > 0) {
                      toast.info("Please select your name from the dropdown");
                    }
                  }}
                >
                  Request Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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

        <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>
                Submit a leave request that will be reviewed by administrators.
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img 
                      src={selectedStudent.image} 
                      alt={selectedStudent.name} 
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white">{selectedStudent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedStudent.role}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input 
                      id="fromDate" 
                      type="date" 
                      value={fromDate} 
                      onChange={(e) => setFromDate(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date</Label>
                    <Input 
                      id="toDate" 
                      type="date" 
                      value={toDate} 
                      onChange={(e) => setToDate(e.target.value)} 
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Explain your reason for requesting leave..." 
                    value={leaveReason} 
                    onChange={(e) => setLeaveReason(e.target.value)} 
                    required
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseLeaveForm}>Cancel</Button>
              <Button onClick={handleSubmitLeaveRequest}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
