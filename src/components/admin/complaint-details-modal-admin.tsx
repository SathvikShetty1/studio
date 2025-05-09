
"use client";

import { useState, useEffect } from 'react';
import type { Complaint, User, ComplaintCategory } from '@/types';
import { ComplaintStatus, ComplaintPriority as ComplaintPriorityEnum } from '@/types'; // Renamed to avoid conflict
import { mockUsers } from '@/lib/mock-data';
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
import { AITriageSection } from './ai-triage-section';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


interface ComplaintDetailsModalAdminProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
}

const UNASSIGNED_VALUE = "_UNASSIGNED_"; // Placeholder for unassigned engineer

export function ComplaintDetailsModalAdmin({ complaint, isOpen, onClose, onUpdateComplaint }: ComplaintDetailsModalAdminProps) {
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriorityEnum | undefined>(complaint?.priority);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | undefined>(complaint?.assignedTo);
  const [internalNote, setInternalNote] = useState('');
  const [engineers, setEngineers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (complaint) {
      setSelectedPriority(complaint.priority);
      setSelectedEngineerId(complaint.assignedTo); // This will be undefined if not assigned
    }
    // Load engineers for assignment
    setEngineers(mockUsers.filter(u => u.role === 'engineer'));
  }, [complaint]);

  if (!complaint) return null;

  const handleSave = () => {
    let updatedStatus = complaint.status;
    const finalSelectedEngineerId = selectedEngineerId === UNASSIGNED_VALUE ? undefined : selectedEngineerId;

    if (finalSelectedEngineerId && (complaint.status === ComplaintStatus.PendingAssignment || complaint.status === ComplaintStatus.Submitted)) {
      updatedStatus = ComplaintStatus.Assigned;
    }


    const updatedComplaint: Complaint = {
      ...complaint,
      priority: selectedPriority,
      assignedTo: finalSelectedEngineerId,
      assignedToName: finalSelectedEngineerId ? engineers.find(e => e.id === finalSelectedEngineerId)?.name : undefined,
      status: updatedStatus,
      updatedAt: new Date(),
      internalNotes: internalNote ? [
        ...(complaint.internalNotes || []),
        { id: `note-${Date.now()}`, userId: 'user-admin1', userName: 'Current Admin', text: internalNote, timestamp: new Date(), isInternal: true }
      ] : complaint.internalNotes,
    };
    onUpdateComplaint(updatedComplaint);
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
    onClose();
  };

  const handleSuggestionApplied = (suggestion: { category: ComplaintCategory; priority: ComplaintPriorityEnum }) => {
    setSelectedPriority(suggestion.priority);
    // Potentially update category too if it's editable by admin
    const updatedComplaint: Complaint = {
      ...complaint,
      category: suggestion.category, // Example: Admin accepts AI category
      priority: suggestion.priority,
      aiSuggestedCategory: suggestion.category,
      aiSuggestedPriority: suggestion.priority,
      aiReasoning: 'AI suggestion applied by admin.', // Simplified reasoning log
      updatedAt: new Date(),
    };
    onUpdateComplaint(updatedComplaint); // Update immediately or wait for final save
    toast({ title: "AI Suggestion Applied", description: `Priority set to ${suggestion.priority}. Category set to ${suggestion.category}.` });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Manage complaint priority, assignment, and add internal notes.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* pr-6 -mr-6 to give space for scrollbar if content overflows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Complaint Info & AI Triage */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center"><strong>Status:</strong>&nbsp;<Badge variant="secondary" className="ml-1">{complaint.status}</Badge></div>
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

              <AITriageSection
                complaintDescription={complaint.description}
                currentCategory={complaint.category}
                currentPriority={complaint.priority}
                onSuggestionApplied={handleSuggestionApplied}
              />
            </div>

            {/* Right Column: Admin Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="priority">Set Priority</Label>
                    <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as ComplaintPriorityEnum)}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ComplaintPriorityEnum).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignee">Assign to Engineer</Label>
                    <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                      <SelectTrigger id="assignee">
                        <SelectValue placeholder="Select engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        {engineers.map(eng => <SelectItem key={eng.id} value={eng.id}>{eng.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
