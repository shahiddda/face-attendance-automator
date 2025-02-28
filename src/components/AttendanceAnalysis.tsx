
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AttendanceRecord } from '@/lib/face-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceAnalysisProps {
  records: AttendanceRecord[];
}

const AttendanceAnalysis: React.FC<AttendanceAnalysisProps> = ({ records }) => {
  // Process data for daily attendance count
  const dailyAttendanceData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; count: number }>();
    
    records.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, count: 0 });
      }
      dailyMap.get(date)!.count += 1;
    });
    
    // Convert map to array and sort by date
    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Get last 7 days
  }, [records]);

  // Process data for status distribution
  const statusDistributionData = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    records.forEach(record => {
      if (!statusMap.has(record.status)) {
        statusMap.set(record.status, 0);
      }
      statusMap.set(record.status, statusMap.get(record.status)! + 1);
    });
    
    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize status
      count
    }));
  }, [records]);

  // Process data for student attendance frequency
  const studentAttendanceData = useMemo(() => {
    const studentMap = new Map<string, { name: string; count: number }>();
    
    records.forEach(record => {
      if (!studentMap.has(record.personId)) {
        studentMap.set(record.personId, { name: record.personName, count: 0 });
      }
      studentMap.get(record.personId)!.count += 1;
    });
    
    // Convert map to array and sort by count (descending)
    return Array.from(studentMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5 students
  }, [records]);

  // Colors for the pie chart
  const COLORS = ['#4ade80', '#f59e0b', '#ef4444'];

  if (records.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 text-center">
        <p className="text-muted-foreground dark:text-gray-400">No attendance data available for analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Attendance Chart */}
      <Card className="dark:bg-gray-800/50 border-border dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-foreground dark:text-white">Daily Attendance</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Number of attendances recorded each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyAttendanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                <Bar dataKey="count" name="Attendances" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card className="dark:bg-gray-800/50 border-border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground dark:text-white">Attendance Status</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Distribution of attendance by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance Frequency */}
        <Card className="dark:bg-gray-800/50 border-border dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-foreground dark:text-white">Top Attendees</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Students with the most attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentAttendanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                  <Bar dataKey="count" name="Attendances" fill="#4ade80" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceAnalysis;
