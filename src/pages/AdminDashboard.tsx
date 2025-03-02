
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getPeople, Person, getAttendanceRecords, AttendanceRecord } from '@/lib/face-api';
import { CheckCircleIcon, UserCheckIcon, UserXIcon, ShieldIcon, LogOutIcon, UserPlusIcon, CalendarIcon, CheckIcon, XIcon } from 'lucide-react';
import AttendanceTable from '@/components/AttendanceTable';
import RegisterPersonForm from '@/components/RegisterPersonForm';

const AdminDashboard = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const { 
    isAdmin, 
    logout, 
    approveStudent, 
    revokeStudentApproval, 
    isStudentApproved,
    leaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest
  } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      toast.error('You must be logged in as admin to view this page');
      navigate('/admin-login');
    }
  }, [isAdmin, navigate]);

  // Load data
  useEffect(() => {
    setPeople(getPeople());
    setRecords(getAttendanceRecords());
  }, []);

  const handleApprovalToggle = (person: Person, approved: boolean) => {
    if (approved) {
      approveStudent(person.id);
      toast.success(`${person.name} has been approved for attendance`);
    } else {
      revokeStudentApproval(person.id);
      toast.info(`${person.name}'s attendance permission has been revoked`);
    }
    // Refresh the list to show the updated state
    setPeople([...getPeople()]);
  };

  const handleLogout = () => {
    logout();
    toast.info('Admin logged out');
    navigate('/');
  };

  const handlePersonRegistered = () => {
    // Refresh people list
    setPeople(getPeople());
    setShowRegisterForm(false);
    toast.success('New student registered successfully');
  };

  const handleApproveLeave = (requestId: string, studentName: string) => {
    approveLeaveRequest(requestId);
    toast.success(`Leave request approved for ${studentName}`);
  };

  const handleRejectLeave = (requestId: string, studentName: string) => {
    rejectLeaveRequest(requestId);
    toast.info(`Leave request rejected for ${studentName}`);
  };

  if (!isAdmin) {
    return null; // Will redirect via the useEffect
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white flex items-center">
              <ShieldIcon className="mr-2 h-6 w-6 text-purple-500" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 dark:text-gray-400">
              Manage student registrations and attendance permissions
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-4 w-4" />
            Logout
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Register New Student Card */}
          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setShowRegisterForm(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <UserPlusIcon className="mr-2 h-6 w-6 text-blue-500" />
                Register New Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                Add a new student to the system with facial recognition
              </p>
              <Button 
                className="w-full dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={() => setShowRegisterForm(true)}
              >
                Register Student
              </Button>
            </CardContent>
          </Card>

          {/* Back to Main App Card */}
          <Card 
            className="dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate('/')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-foreground dark:text-white">
                <CheckCircleIcon className="mr-2 h-6 w-6 text-green-500" />
                Main Application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground dark:text-gray-400 mb-4">
                Return to the main attendance tracking application
              </p>
              <Button 
                className="w-full dark:bg-green-600 dark:hover:bg-green-700"
                onClick={() => navigate('/')}
              >
                Go to Main App
              </Button>
            </CardContent>
          </Card>
        </div>

        {showRegisterForm && (
          <RegisterPersonForm
            isOpen={true}
            onClose={() => setShowRegisterForm(false)}
            onPersonRegistered={handlePersonRegistered}
          />
        )}

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="students">Manage Students</TabsTrigger>
            <TabsTrigger value="attendance">Recent Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Student Approvals</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Manage which students are allowed to mark attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {people.length === 0 ? (
                  <p className="text-center py-8 dark:text-gray-300">No students registered yet</p>
                ) : (
                  <div className="space-y-4">
                    {people.map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <img 
                              src={person.image} 
                              alt={person.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium dark:text-white">{person.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{person.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isStudentApproved(person.id) ? (
                            <UserCheckIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <UserXIcon className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`approve-${person.id}`}
                              checked={isStudentApproved(person.id)}
                              onCheckedChange={(checked) => handleApprovalToggle(person, checked)}
                            />
                            <Label htmlFor={`approve-${person.id}`} className="dark:text-gray-300">
                              {isStudentApproved(person.id) ? 'Approved' : 'Not Approved'}
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Recent Attendance</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Review the most recent attendance entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceTable records={records} className="dark:text-gray-300" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground dark:text-white">
                  <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
                  Student Leave Requests
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Manage leave requests from students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8 dark:text-gray-300">
                    <p>No leave requests at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`p-4 rounded-lg border ${
                          request.status === 'approved' 
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                            : request.status === 'rejected'
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium dark:text-white">{request.studentName}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                request.status === 'pending' 
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' 
                                  : request.status === 'approved'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              From: {new Date(request.fromDate).toLocaleDateString()} - To: {new Date(request.toDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm dark:text-gray-300 mb-1">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Requested on: {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => handleApproveLeave(request.id, request.studentName)}
                              >
                                <CheckIcon className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleRejectLeave(request.id, request.studentName)}
                              >
                                <XIcon className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
