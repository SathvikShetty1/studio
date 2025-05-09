
"use client";

import { useState, useEffect } from 'react';
import type { Complaint, ComplaintNote } from '@/types';
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

interface ComplaintDetailsModalEngineerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
}

export function ComplaintDetailsModalEngineer({ complaint, isOpen, onClose, onUpdateComplaint }: ComplaintDetailsModalEngineerProps) {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | undefined>(complaint?.status);
  const [resolutionDetails, setResolutionDetails] = useState(complaint?.resolutionDetails || '');
  const [internalNote, setInternalNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setResolutionDetails(complaint.resolutionDetails || '');
    }
  }, [complaint]);

  if (!complaint) return null;

  const isTerminalStatus = complaint.status === ComplaintStatus.Resolved || complaint.status === ComplaintStatus.Closed;

  const handleSave = () => {
    let updatedResolvedAt: Date | undefined = complaint.resolvedAt;
    if (selectedStatus === ComplaintStatus.Resolved && complaint.status !== ComplaintStatus.Resolved) {
      updatedResolvedAt = new Date();
    }
    
    const updatedComplaint: Complaint = {
      ...complaint,
      status: selectedStatus || complaint.status,
      resolutionDetails: resolutionDetails,
      resolvedAt: updatedResolvedAt,
      updatedAt: new Date(),
      internalNotes: internalNote ? [
        ...(complaint.internalNotes || []),
        { id: `note-${Date.now()}`, userId: 'user-engineer', userName: 'Current Engineer', text: internalNote, timestamp: new Date(), isInternal: true }
      ] : complaint.internalNotes,
    };
    onUpdateComplaint(updatedComplaint);
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Update the status and resolution details for this complaint.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* pr-6 -mr-6 to give space for scrollbar if content overflows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Complaint Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <p><strong>Priority:</strong> <Badge variant="secondary">{complaint.priority}</Badge></p>
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

            {/* Right Column: Engineer Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Engineer Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select value={selectedStatus} disabled={isTerminalStatus} onValueChange={(value) => setSelectedStatus(value as ComplaintStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ComplaintStatus).filter(s => s !== ComplaintStatus.Submitted && s !== ComplaintStatus.PendingAssignment).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolution-details">Resolution Details</Label>
                    <Textarea
                      id="resolution-details"
                      placeholder="Enter details about the resolution..."
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      rows={3}
                      disabled={isTerminalStatus}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internal-note">Add Internal Note</Label>
                    <Textarea
                      id="internal-note"
                      placeholder="Add internal comments or updates..."
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isTerminalStatus}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

