"use client";

import { useState, useEffect } from 'react';
import type { Complaint, ComplaintNote, User } from '@/types';
import { ComplaintStatus } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';

interface ComplaintDetailsModalEngineerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
}

// Engineer can only set these statuses
const engineerAllowedStatuses: ComplaintStatus[] = [
  ComplaintStatus.InProgress,
  ComplaintStatus.Resolved,
  ComplaintStatus.Unresolved,
];

export function ComplaintDetailsModalEngineer({ complaint, isOpen, onClose, onUpdateComplaint }: ComplaintDetailsModalEngineerProps) {
  const { user: engineerUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | undefined>(complaint?.status);
  const [resolutionDetails, setResolutionDetails] = useState(complaint?.resolutionDetails || '');
  const [internalNote, setInternalNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setResolutionDetails(complaint.resolutionDetails || '');
      setInternalNote(''); // Clear note on new complaint
    }
  }, [complaint]);

  if (!complaint) return null;

  // These statuses are considered terminal from an engineer's perspective for editing.
  // Once Closed or Escalated by admin, engineer typically cannot change them further from this modal.
  const isTerminalStatusForEngineer = [ComplaintStatus.Closed, ComplaintStatus.Escalated].includes(complaint.status);

  const handleSave = () => {
    if (!engineerUser) {
        toast({ title: "Error", description: "User not found. Cannot save changes.", variant: "destructive"});
        return;
    }

    let updatedResolvedAt: Date | undefined = complaint.resolvedAt;
    if (selectedStatus === ComplaintStatus.Resolved && complaint.status !== ComplaintStatus.Resolved) {
      updatedResolvedAt = new Date();
    }
    
    const updatedComplaint: Complaint = {
      ...complaint,
      status: selectedStatus || complaint.status,
      resolutionDetails: resolutionDetails, // This field can be used for 'unresolution' notes too if status is Unresolved
      resolvedAt: updatedResolvedAt,
      updatedAt: new Date(),
      internalNotes: internalNote ? [
        ...(complaint.internalNotes || []),
        { 
            id: `note-${Date.now()}`, 
            userId: engineerUser.id, 
            userName: engineerUser.name, 
            text: internalNote, 
            timestamp: new Date(), 
            isInternal: true 
        }
      ] : complaint.internalNotes,
    };
    onUpdateComplaint(updatedComplaint);
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated by ${engineerUser.name}.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Update the status and resolution details for this complaint. Current Engineer Level: {complaint.currentHandlerLevel || "N/A"}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center"><strong>Priority:</strong>&nbsp;<Badge variant={complaint.priority === "High" || complaint.priority === "Critical" ? "destructive" : "secondary"} className="ml-1">{complaint.priority || "N/A"}</Badge></div>
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 p-2 bg-secondary rounded-md">{complaint.description}</p>
                  </div>
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div>
                      <strong>Attachments:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {complaint.attachments.map(att => (
                          <li key={att.id} className="text-primary hover:underline">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                              <Paperclip className="h-4 w-4 mr-1 inline-block" /> {att.fileName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
               {complaint.internalNotes && complaint.internalNotes.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-md">Internal Notes History</CardTitle></CardHeader>
                  <CardContent className="max-h-48 overflow-y-auto space-y-2 text-xs">
                    {complaint.internalNotes.slice().reverse().map(note => (
                      <div key={note.id} className="p-2 bg-secondary rounded">
                        <p className="font-semibold">{note.userName} <span className="font-normal text-muted-foreground">({format(new Date(note.timestamp), "PP p")})</span>:</p>
                        <p>{note.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Engineer Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select 
                        value={selectedStatus} 
                        disabled={isTerminalStatusForEngineer} 
                        onValueChange={(value) => setSelectedStatus(value as ComplaintStatus)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show current status if it's not in allowed list but is the current one */}
                        {complaint.status && !engineerAllowedStatuses.includes(complaint.status) && !isTerminalStatusForEngineer && (
                             <SelectItem value={complaint.status} disabled>{complaint.status} (Current)</SelectItem>
                        )}
                        {engineerAllowedStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {isTerminalStatusForEngineer && <p className="text-xs text-muted-foreground mt-1">Status is terminal ({complaint.status}) and cannot be changed by engineer.</p>}
                  </div>
                  <div>
                    <Label htmlFor="resolution-details">
                        {selectedStatus === ComplaintStatus.Unresolved ? "Reason for Unresolution / Further Notes" : "Resolution Details / Update Notes"}
                    </Label>
                    <Textarea
                      id="resolution-details"
                      placeholder={
                        selectedStatus === ComplaintStatus.Unresolved 
                        ? "Explain why this complaint cannot be resolved at this level or what is needed..." 
                        : "Enter details about the resolution or progress..."
                      }
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      rows={3}
                      disabled={isTerminalStatusForEngineer}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internal-note">Add Internal Note (for team)</Label>
                    <Textarea
                      id="internal-note"
                      placeholder="Add internal comments or updates for the team..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isTerminalStatusForEngineer}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
