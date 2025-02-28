
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceRecord } from '@/lib/face-api';
import { CalendarIcon, UserIcon, ClockIcon } from 'lucide-react';

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

  return (
    <div className={`w-full overflow-auto ${className}`}>
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
