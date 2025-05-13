
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Complaint, User } from '@/types';
import { ComplaintStatus, ComplaintPriority, EngineerLevel, UserRole } from '@/types';
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
import { Paperclip, UserSquare, AlertTriangle, CheckCircle, ListChecks, ChevronsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { getAllUsers } from '@/services/userService'; // To fetch engineers

interface ComplaintDetailsModalAdminProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => Promise<void>;
}

const getNextEngineerLevel = (currentLevel?: EngineerLevel): EngineerLevel | undefined => {
  if (!currentLevel) return EngineerLevel.Junior; // Default to Junior if no current level
  if (currentLevel === EngineerLevel.Junior) return EngineerLevel.Senior;
  if (currentLevel === EngineerLevel.Senior) return EngineerLevel.Executive;
  return undefined; // Executive is the highest
};

export function ComplaintDetailsModalAdmin({ complaint, isOpen, onClose, onUpdateComplaint }: ComplaintDetailsModalAdminProps) {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [availableEngineers, setAvailableEngineers] = useState<User[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | undefined>(complaint?.status);
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority | undefined>(complaint?.priority);
  const [assignedEngineerId, setAssignedEngineerId] = useState<string | undefined>(complaint?.assignedTo);
  const [resolutionTimeline, setResolutionTimeline] = useState<string>(
    complaint?.resolutionTimeline ? format(new Date(complaint.resolutionTimeline), "yyyy-MM-dd") : ""
  );
  const [internalNote, setInternalNote] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getAllUsers();
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setSelectedPriority(complaint.priority);
      setAssignedEngineerId(complaint.assignedTo);
      setResolutionTimeline(complaint.resolutionTimeline ? format(new Date(complaint.resolutionTimeline), "yyyy-MM-dd") : "");
      setInternalNote('');

      // Filter engineers based on complaint status and current handler level
      let suitableEngineers = allUsers.filter(u => u.role === UserRole.Engineer);
      if (complaint.status === ComplaintStatus.Unresolved && complaint.currentHandlerLevel) {
        const nextLevel = getNextEngineerLevel(complaint.currentHandlerLevel);
        if (nextLevel) {
          suitableEngineers = suitableEngineers.filter(eng => eng.engineerLevel === nextLevel);
        } else { // Already at highest level
          suitableEngineers = suitableEngineers.filter(eng => eng.engineerLevel === complaint.currentHandlerLevel);
        }
      } else if (complaint.status === ComplaintStatus.Escalated && complaint.currentHandlerLevel) {
         const nextLevel = getNextEngineerLevel(complaint.currentHandlerLevel);
         if(nextLevel) {
            suitableEngineers = suitableEngineers.filter(eng => eng.engineerLevel === nextLevel);
         } else { // Already executive or no higher level
            suitableEngineers = allUsers.filter(u => u.role === UserRole.Engineer && u.engineerLevel === EngineerLevel.Executive);
         }
      }
      setAvailableEngineers(suitableEngineers);

    }
  }, [complaint, allUsers, isOpen]); // Re-run when complaint or isOpen changes

  if (!complaint) return null;

  const handleSave = async () => {
    if (!adminUser) {
        toast({ title: "Error", description: "Admin user not found. Cannot save changes.", variant: "destructive"});
        return;
    }

    const assignedEngineer = allUsers.find(u => u.id === assignedEngineerId);

    const updatedComplaintData: Complaint = {
      ...complaint,
      status: selectedStatus || complaint.status,
      priority: selectedPriority || complaint.priority,
      assignedTo: assignedEngineerId,
      assignedToName: assignedEngineer?.name,
      currentHandlerLevel: assignedEngineer?.engineerLevel,
      resolutionTimeline: resolutionTimeline ? new Date(resolutionTimeline) : undefined,
      internalNotes: internalNote ? [
        ...(complaint.internalNotes || []),
        { 
            id: `note-${Date.now()}`, 
            userId: adminUser.id, 
            userName: adminUser.name, 
            text: internalNote, 
            timestamp: new Date(),
            isInternal: true 
        }
      ] : complaint.internalNotes,
    };
    await onUpdateComplaint(updatedComplaintData);
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
    onClose();
  };

  const canEscalate = complaint.status === ComplaintStatus.Unresolved && complaint.currentHandlerLevel !== EngineerLevel.Executive;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Complaint: #{complaint.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Assign engineers, set priority, update status, and add notes.
             Current Assigned: {complaint.assignedToName || "None"} ({complaint.currentHandlerLevel || "N/A"})
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column: Complaint Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center">
                    <strong>Current Priority:</strong>&nbsp;
                    <Badge variant={complaint.priority === ComplaintPriority.High || complaint.priority === ComplaintPriority.Escalated ? "destructive" : "secondary"} className="ml-1">
                        {complaint.priority || "N/A"}
                    </Badge>
                  </div>
                   <div className="flex items-center">
                    <strong>Current Status:</strong>&nbsp;
                    <Badge variant="outline" className="ml-1">{complaint.status}</Badge>
                  </div>
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

            {/* Right Column: Admin Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="assign-engineer">Assign Engineer</Label>
                    <Select value={assignedEngineerId || ""} onValueChange={setAssignedEngineerId}>
                      <SelectTrigger id="assign-engineer">
                        <SelectValue placeholder="Select engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassign</SelectItem>
                        {availableEngineers.map(eng => (
                          <SelectItem key={eng.id} value={eng.id}>
                            {eng.name} ({eng.engineerLevel})
                          </SelectItem>
                        ))}
                         {availableEngineers.length === 0 && complaint.status === ComplaintStatus.Unresolved && <SelectItem value="" disabled>No higher level engineers available for escalation.</SelectItem>}
                         {availableEngineers.length === 0 && complaint.status !== ComplaintStatus.Unresolved && <SelectItem value="" disabled>No engineers available.</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Set Priority</Label>
                    <Select value={selectedPriority || ""} onValueChange={(value) => setSelectedPriority(value as ComplaintPriority)}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ComplaintPriority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Set Status</Label>
                     <Select value={selectedStatus || ""} onValueChange={(value) => {
                       setSelectedStatus(value as ComplaintStatus);
                       // If escalating, clear assigned engineer so admin has to pick a higher level one
                       if(value === ComplaintStatus.Escalated) {
                           setAssignedEngineerId(undefined);
                           const nextLevel = getNextEngineerLevel(complaint.currentHandlerLevel);
                           setAvailableEngineers(allUsers.filter(u => u.role === UserRole.Engineer && u.engineerLevel === (nextLevel || EngineerLevel.Executive)));
                       } else if (value === ComplaintStatus.Unresolved) {
                           // Keep current assignment if unresolved, or allow re-assignment
                       }
                     }}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ComplaintStatus)
                          .filter(s => s !== ComplaintStatus.Unresolved || !canEscalate) // Hide "Unresolved" if can escalate
                          .map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        {canEscalate && <SelectItem value={ComplaintStatus.Escalated} className="text-destructive focus:text-destructive">Escalate to Next Level</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolution-timeline">Resolution Timeline (Optional)</Label>
                    <Input 
                        id="resolution-timeline" 
                        type="date" 
                        value={resolutionTimeline}
                        onChange={(e) => setResolutionTimeline(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd")} // Prevent past dates
                    />
                  </div>
                  <div>
                    <Label htmlFor="internal-note">Add Internal Note</Label>
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
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
