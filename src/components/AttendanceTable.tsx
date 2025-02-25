
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceRecord } from '@/lib/face-api';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  className?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, className = '' }) => {
  return (
    <div className={`w-full overflow-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.personName}</TableCell>
              <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.status === 'present'
                      ? 'default'
                      : record.status === 'late'
                      ? 'warning'
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
  );
};

export default AttendanceTable;
