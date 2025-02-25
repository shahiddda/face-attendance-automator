
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserIcon } from 'lucide-react';
import { Person } from '@/lib/face-api';

interface PersonCardProps {
  person: Person;
  attendance?: {
    status: 'present' | 'absent' | 'late';
    time?: string;
  };
  className?: string;
}

const PersonCard: React.FC<PersonCardProps> = ({ person, attendance, className = '' }) => {
  const badgeVariant = attendance ? (
    attendance.status === 'present' ? 'default' : 
    attendance.status === 'late' ? 'warning' : 'destructive'
  ) : undefined;
  
  const badgeText = attendance ? (
    attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)
  ) : '';

  return (
    <Card className={`w-full transition-all duration-300 hover:shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          {person.name}
          {attendance && (
            <Badge variant={badgeVariant}>{badgeText}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="flex items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            {person.image ? (
              <img
                src={person.image}
                alt={person.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-col">
            <p className="text-sm text-muted-foreground mb-1">{person.role}</p>
            <p className="text-sm text-muted-foreground">ID: {person.id.substring(0, 8)}</p>
            {attendance && attendance.time && (
              <p className="text-sm text-muted-foreground mt-2">
                {attendance.time}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonCard;
