import type { Complaint } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, MessageSquare, AlertTriangle, CheckCircle, User, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ComplaintPriority as ComplaintPriorityEnum } from '@/types';


interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void; // For making the card clickable, e.g., to show details
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Submitted':
    case 'Pending Assignment':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'In Progress':
    case 'Assigned':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'Resolved':
    case 'Closed':
      return 'bg-green-500 hover:bg-green-600';
    case 'Escalated': // Status
      return 'bg-red-500 hover:bg-red-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getPriorityColor = (priority?: ComplaintPriorityEnum) => {
  switch (priority) {
    case ComplaintPriorityEnum.Low:
      return 'bg-green-100 text-green-800 border-green-300';
    case ComplaintPriorityEnum.Medium:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case ComplaintPriorityEnum.High:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case ComplaintPriorityEnum.Escalated: // Priority (formerly Critical)
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-200", onClick && "cursor-pointer")} onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg mb-1">Complaint #{complaint.id.slice(-6)}</CardTitle>
          <Badge variant="outline" className={cn(getStatusColor(complaint.status), "text-xs text-white")}>{complaint.status}</Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" /> Submitted: {format(new Date(complaint.submittedAt), "MMM d, yyyy HH:mm")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm">
          <Tag className="mr-2 h-4 w-4 text-primary" />
          <strong>Category:</strong> <span className="ml-1">{complaint.category}</span>
        </div>
        {complaint.priority && (
          <div className="flex items-center text-sm">
            <AlertTriangle className="mr-2 h-4 w-4 text-primary" />
            <strong>Priority:</strong> 
            <Badge variant="outline" className={cn("ml-1 text-xs", getPriorityColor(complaint.priority))}>{complaint.priority}</Badge>
          </div>
        )}
        <div className="text-sm">
          <MessageSquare className="mr-2 h-4 w-4 text-primary inline-block align-text-bottom" />
          <strong>Description:</strong>
          <p className="ml-6 text-muted-foreground line-clamp-3">
            {complaint.description}
          </p>
        </div>
         {complaint.assignedToName && (
          <div className="flex items-center text-sm">
            <User className="mr-2 h-4 w-4 text-primary" />
            <strong>Assigned To:</strong> <span className="ml-1">{complaint.assignedToName}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
        <span>Last updated: {format(new Date(complaint.updatedAt), "MMM d, yyyy")}</span>
        {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="flex items-center">
                <Paperclip className="h-3 w-3 mr-1" /> {complaint.attachments.length} attachment(s)
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

