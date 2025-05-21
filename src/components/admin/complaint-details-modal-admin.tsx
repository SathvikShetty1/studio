
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Complaint, User, ComplaintCategory } from '@/types';
import { ComplaintStatus, ComplaintPriority as ComplaintPriorityEnum, EngineerLevel, UserRole } from '@/types';
import { getAllMockUsers } from '@/lib/mock-data'; // Changed import
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Paperclip, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';

interface ComplaintDetailsModalAdminProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
}

const UNASSIGNED_VALUE = "_UNASSIGNED_";
const engineerLevelOrder: EngineerLevel[] = [EngineerLevel.Junior, EngineerLevel.Senior, EngineerLevel.Executive];

export function ComplaintDetailsModalAdmin({ complaint, isOpen, onClose, onUpdateComplaint }: ComplaintDetailsModalAdminProps) {
  const { user: adminUser } = useAuth();
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriorityEnum | undefined>(complaint?.priority);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | undefined>(complaint?.assignedTo || UNASSIGNED_VALUE);
  const [internalNote, setInternalNote] = useState('');
  const [resolutionTimeline, setResolutionTimeline] = useState<string>('');

  const { toast } = useToast();

  const allUsers = useMemo(() => getAllMockUsers(), []); // Use function to get all users
  const allEngineers = useMemo(() => allUsers.filter(u => u.role === UserRole.Engineer), [allUsers]);

  const [engineersForAssignment, setEngineersForAssignment] = useState<User[]>(allEngineers);

  useEffect(() => {
    if (complaint) {
      setSelectedPriority(complaint.priority);
      setSelectedEngineerId(complaint.assignedTo || UNASSIGNED_VALUE);
      setResolutionTimeline(complaint.resolutionTimeline ? format(new Date(complaint.resolutionTimeline), "yyyy-MM-dd") : '');
      setInternalNote('');

      let displayEngineers = [...allEngineers];
      if ((complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && complaint.assignedTo) {
        const currentAssignee = allUsers.find(u => u.id === complaint.assignedTo); // Use allUsers here
        if (currentAssignee && currentAssignee.role === UserRole.Engineer && currentAssignee.engineerLevel) {
          const currentLevelIndex = engineerLevelOrder.indexOf(currentAssignee.engineerLevel);
          if (currentLevelIndex < engineerLevelOrder.length - 1) { 
            displayEngineers = allEngineers.filter(eng => 
              eng.engineerLevel && engineerLevelOrder.indexOf(eng.engineerLevel) > currentLevelIndex
            );
          } else { 
            displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive && eng.id !== currentAssignee.id);
            if (displayEngineers.length === 0) {
                const otherExecutives = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive && eng.id !== currentAssignee.id);
                if (otherExecutives.length > 0) {
                    displayEngineers = otherExecutives;
                } else {
                    displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive);
                }
            }
          }
        }
      }
      setEngineersForAssignment(displayEngineers.length > 0 ? displayEngineers : allEngineers); 
    } else {
      setEngineersForAssignment(allEngineers);
    }
  }, [complaint, allEngineers, allUsers]);


  if (!complaint) return null;

  const handleSave = () => {
    let updatedStatus = complaint.status;
    const finalSelectedEngineerId = selectedEngineerId === UNASSIGNED_VALUE ? undefined : selectedEngineerId;
    const assignedEngineer = finalSelectedEngineerId ? allUsers.find(e => e.id === finalSelectedEngineerId) : undefined; // Use allUsers

    if (finalSelectedEngineerId && (complaint.status === ComplaintStatus.PendingAssignment || complaint.status === ComplaintStatus.Submitted || complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated)) {
      updatedStatus = ComplaintStatus.Assigned;
    }


    const updatedComplaint: Complaint = {
      ...complaint,
      priority: selectedPriority,
      assignedTo: finalSelectedEngineerId,
      assignedToName: assignedEngineer?.name,
      currentHandlerLevel: assignedEngineer?.engineerLevel,
      status: updatedStatus,
      resolutionTimeline: resolutionTimeline ? new Date(resolutionTimeline) : undefined,
      updatedAt: new Date(),
      internalNotes: internalNote ? [
        ...(complaint.internalNotes || []),
        { 
          id: `note-${Date.now()}`, 
          userId: adminUser?.id || 'unknown-admin', 
          userName: adminUser?.name || 'Admin', 
          text: internalNote, 
          timestamp: new Date(), 
          isInternal: true 
        }
      ] : complaint.internalNotes,
    };
    onUpdateComplaint(updatedComplaint);
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
    onClose();
  };
  
  const handleEscalate = () => {
    if (!complaint || !adminUser) return;

    let newStatus = ComplaintStatus.Escalated;
    if (complaint.status === ComplaintStatus.Resolved) {
        newStatus = ComplaintStatus.Escalated; 
    }

    const escalatedComplaint: Complaint = {
      ...complaint,
      status: newStatus, 
      updatedAt: new Date(),
      priority: ComplaintPriorityEnum.Escalated, 
      internalNotes: [
        ...(complaint.internalNotes || []),
        { 
          id: `note-escalate-${Date.now()}`, 
          userId: adminUser.id, 
          userName: adminUser.name, 
          text: `Complaint escalated by admin. Priority set to ${ComplaintPriorityEnum.Escalated}.`, 
          timestamp: new Date(), 
          isInternal: true 
        }
      ],
    };
    onUpdateComplaint(escalatedComplaint); 
    setSelectedPriority(ComplaintPriorityEnum.Escalated); 
    toast({ title: "Complaint Escalated", description: `Complaint #${complaint.id.slice(-6)} is now ${newStatus} and priority set to ${ComplaintPriorityEnum.Escalated}.` });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
           <DialogDescription className="flex items-center gap-2">
            <span>Manage complaint status, priority, assignment, and add internal notes.</span>
            <Badge variant="outline">{complaint.status}</Badge>
            {complaint.assignedToName && complaint.currentHandlerLevel && (
              <span className="text-xs">(Handler: {complaint.assignedToName} - {complaint.currentHandlerLevel})</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 bg-red-100"> {/* Temporary bg-red-100 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 bg-blue-100"> {/* Temporary bg-blue-100 */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center"><strong>Current Priority:</strong>&nbsp;<Badge variant={(complaint.priority === ComplaintPriorityEnum.High || complaint.priority === ComplaintPriorityEnum.Escalated) ? "destructive" : "secondary"} className="ml-1">{complaint.priority || "N/A"}</Badge></div>
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
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Set Status</Label>
                     <Select value={complaint.status} disabled> {/* Status is informational for now, assignment logic determines if it becomes 'Assigned' */}
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ComplaintStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignee">Assign Engineer</Label>
                    <Select value={selectedEngineerId || UNASSIGNED_VALUE} onValueChange={setSelectedEngineerId}>
                      <SelectTrigger id="assignee">
                        <SelectValue placeholder="Select engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        {engineersForAssignment.length > 0 ? (
                            engineersForAssignment.map(eng => <SelectItem key={eng.id} value={eng.id}>{eng.name} ({eng.engineerLevel})</SelectItem>)
                        ) : (
                            <SelectItem value="no_eligible_engineers" disabled>No eligible higher-level engineers</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {(complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && engineersForAssignment.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">No higher-level engineers available for escalation based on current assignment.</p>
                    )}
                  </div>
                  
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
                    <Label htmlFor="resolution-timeline">Resolution Timeline (Optional)</Label>
                    <Input 
                        id="resolution-timeline" 
                        type="date" 
                        value={resolutionTimeline}
                        onChange={(e) => setResolutionTimeline(e.target.value)}
                        className="block w-full"
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
        
        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          {complaint.status !== ComplaintStatus.Closed && ( 
            <Button variant="destructive" onClick={handleEscalate} className="mr-auto sm:mr-2 mb-2 sm:mb-0">
              <AlertTriangle className="mr-2 h-4 w-4" />
              {complaint.status === ComplaintStatus.Escalated ? "Re-Escalate/Update" : "Escalate Complaint"}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    