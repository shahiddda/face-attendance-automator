
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttendanceRecord, exportAttendanceToExcel } from '@/lib/face-api';
import { CalendarIcon, UserIcon, ClockIcon, DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  className?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, className = '' }) => {
  // Group records by date for better organization
  const groupedRecords: Record<string, AttendanceRecord[]> = {};
  
  records.forEach(record => {
    const date = new Date(record.timestamp).toLocaleDateString();
    if (!groupedRecords[date]) {
      groupedRecords[date] = [];
    }
    groupedRecords[date].push(record);
  });

  const handleExportToExcel = () => {
    if (records.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    try {
      // Format records for Excel export
      const excelData = records.map(record => ({
        'Student ID': record.personId,
        'Student Name': record.personName,
        'Date': new Date(record.timestamp).toLocaleDateString(),
        'Time': new Date(record.timestamp).toLocaleTimeString(),
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1)
      }));
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
      
      // Generate Excel file
      XLSX.writeFile(workbook, `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Attendance records exported to Excel', {
        description: `File downloaded: attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export attendance records');
    }
  };

  return (
    <div className={`w-full overflow-auto ${className}`}>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleExportToExcel} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <DownloadIcon className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>
      
      {Object.keys(groupedRecords).length > 0 ? (
        Object.entries(groupedRecords).map(([date, dateRecords]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center mb-2 text-primary">
              <CalendarIcon className="mr-2 h-5 w-5" />
              <h3 className="font-medium">{date}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Name
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4" />
                      Time
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.personName}</TableCell>
                    <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === 'present'
                            ? 'default'
                            : record.status === 'late'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No attendance records found
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
