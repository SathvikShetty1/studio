
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { ComplaintStatus, ComplaintPriority as ComplaintPriorityEnum } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Paperclip, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';

interface ComplaintDetailsModalEngineerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setResolutionDetails(complaint.resolutionDetails || '');
      setInternalNote('');
    }
  }, [complaint]);


  const handleSave = async () => {
    if (!engineerUser || !complaint) {
        toast({ title: "Error", description: "User or complaint data not found.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);

    let updatedResolvedAt: Date | string | undefined = complaint.resolvedAt;
    if (selectedStatus === ComplaintStatus.Resolved && complaint.status !== ComplaintStatus.Resolved) {
      updatedResolvedAt = new Date();
    } else if (selectedStatus !== ComplaintStatus.Resolved) {
      updatedResolvedAt = undefined;
    }
    
    const newInternalNotes = complaint.internalNotes ? [...complaint.internalNotes] : [];
    if (internalNote.trim()) {
        newInternalNotes.push({
            id: `note-mongo-${Date.now()}`, // Placeholder, MongoDB will generate _id
            userId: engineerUser.id,
            userName: engineerUser.name,
            text: internalNote,
            timestamp: new Date(),
            isInternal: true,
        });
    }

    const updatePayload = {
      status: selectedStatus || complaint.status,
      resolutionDetails: resolutionDetails,
      resolvedAt: updatedResolvedAt ? new Date(updatedResolvedAt).toISOString() : undefined,
      internalNotes: newInternalNotes.map(note => ({
          userId: note.userId,
          userName: note.userName,
          text: note.text,
          timestamp: note.timestamp,
          isInternal: note.isInternal,
      })),
    };

    try {
        const response = await fetch(`/api/complaints/${complaint.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
            const updatedComplaintData = await response.json();
            onUpdateComplaint(updatedComplaintData);
            toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
            onClose();
        } else {
            const errorData = await response.json();
            toast({ title: "Update Failed", description: errorData.message || "Could not update complaint.", variant: "destructive"});
        }
    } catch (error) {
        console.error("Error updating complaint by engineer:", error);
        toast({ title: "Network Error", description: "Failed to connect to server.", variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !complaint) return null;

  const isTerminalStatusForEngineer = [
      ComplaintStatus.Closed,
      ComplaintStatus.Escalated,
      ComplaintStatus.PendingAssignment,
      ComplaintStatus.Submitted
    ].includes(complaint.status);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Update the status and resolution details for this complaint. Your Level: {engineerUser?.engineerLevel || "N/A"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center"><strong>Priority:</strong>&nbsp;<Badge variant={complaint.priority === ComplaintPriorityEnum.High || complaint.priority === ComplaintPriorityEnum.Escalated ? "destructive" : "secondary"} className="ml-1">{complaint.priority || "N/A"}</Badge></div>
                  {complaint.resolutionTimeline && (
                    <p className="flex items-center">
                      <CalendarClock className="mr-2 h-4 w-4 text-primary" />
                      <strong>Resolution Due:</strong>&nbsp;{format(new Date(complaint.resolutionTimeline), "PP")}
                    </p>
                  )}
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 p-2 bg-secondary rounded-md whitespace-pre-wrap">{complaint.description}</p>
                  </div>
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div>
                      <strong>Attachments:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {complaint.attachments.map(att => (
                          <li key={att.id || att.fileName} className="text-primary hover:underline text-xs">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                              <Paperclip className="h-3 w-3 mr-1.5 inline-block flex-shrink-0" /> {att.fileName}
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
                  <CardContent className="space-y-2 text-xs p-4">
                    {complaint.internalNotes.slice().reverse().map(note => (
                      <div key={note.id || `note-${new Date(note.timestamp).getTime()}`} className="p-2 bg-secondary rounded">
                        <p className="font-semibold">{note.userName} <span className="font-normal text-muted-foreground">({format(new Date(note.timestamp), "PP p")})</span>:</p>
                        <p className="whitespace-pre-wrap">{note.text}</p>
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
                        {complaint.status && !engineerAllowedStatuses.includes(complaint.status) && (
                             <SelectItem value={complaint.status} disabled>{complaint.status} (Current)</SelectItem>
                        )}
                        {engineerAllowedStatuses.map(s => <SelectItem key={s} value={s} disabled={isTerminalStatusForEngineer && s !== complaint.status}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {isTerminalStatusForEngineer && <p className="text-xs text-muted-foreground mt-1">Status is ({complaint.status}) and cannot be changed by engineer at this stage.</p>}
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
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isTerminalStatusForEngineer || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
