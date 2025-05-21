
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Complaint, User, ComplaintCategory, ComplaintNote } from '@/types';
import { ComplaintStatus, ComplaintPriority as ComplaintPriorityEnum, EngineerLevel, UserRole } from '@/types';
import { getAllMockUsers, updateMockComplaint } from '@/lib/mock-data';
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
// Removed ScrollArea import as we are trying a direct CSS scroll
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Paperclip, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [currentStatus, setCurrentStatus] = useState<ComplaintStatus | undefined>(complaint?.status);
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriorityEnum | undefined>(complaint?.priority);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | undefined>(complaint?.assignedTo || UNASSIGNED_VALUE);
  const [internalNote, setInternalNote] = useState('');
  const [resolutionTimeline, setResolutionTimeline] = useState<string>('');

  const { toast } = useToast();

  const allUsers = useMemo(() => getAllMockUsers(), []);
  const allEngineers = useMemo(() => allUsers.filter(u => u.role === UserRole.Engineer), [allUsers]);
  const [engineersForAssignment, setEngineersForAssignment] = useState<User[]>(allEngineers);
  const [availableStatuses, setAvailableStatuses] = useState<ComplaintStatus[]>(Object.values(ComplaintStatus));

  useEffect(() => {
    if (complaint) {
      setCurrentStatus(complaint.status);
      setSelectedPriority(complaint.priority);
      setSelectedEngineerId(complaint.assignedTo || UNASSIGNED_VALUE);
      setResolutionTimeline(complaint.resolutionTimeline ? format(new Date(complaint.resolutionTimeline), "yyyy-MM-dd") : '');
      setInternalNote('');

      let displayEngineers = [...allEngineers];
      if ((complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && complaint.assignedTo) {
        const currentAssignee = allUsers.find(u => u.id === complaint.assignedTo);
        if (currentAssignee && currentAssignee.role === UserRole.Engineer && currentAssignee.engineerLevel) {
          const currentLevelIndex = engineerLevelOrder.indexOf(currentAssignee.engineerLevel);
          if (currentLevelIndex < engineerLevelOrder.length - 1) {
            displayEngineers = allEngineers.filter(eng =>
              eng.engineerLevel && engineerLevelOrder.indexOf(eng.engineerLevel) > currentLevelIndex
            );
          } else {
             displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive);
          }
        }
      } else if (complaint.status === ComplaintStatus.Escalated && !complaint.assignedTo) {
        displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Senior || eng.engineerLevel === EngineerLevel.Executive);
      } else if (complaint.status === ComplaintStatus.PendingAssignment || complaint.status === ComplaintStatus.Reopened) {
        displayEngineers = allEngineers;
      }


      setEngineersForAssignment(displayEngineers.length > 0 ? displayEngineers : allEngineers);
      
      let statuses: ComplaintStatus[] = Object.values(ComplaintStatus);
      if (complaint.status === ComplaintStatus.Resolved) {
        statuses = [ComplaintStatus.Resolved, ComplaintStatus.Closed, ComplaintStatus.Reopened];
      } else if (complaint.status === ComplaintStatus.Closed) {
        statuses = [ComplaintStatus.Closed, ComplaintStatus.Reopened];
      } else if (complaint.status === ComplaintStatus.Reopened) {
        statuses = [ComplaintStatus.Reopened, ComplaintStatus.PendingAssignment, ComplaintStatus.Assigned, ComplaintStatus.InProgress];
      } else if (complaint.status === ComplaintStatus.Escalated && complaint.currentHandlerLevel === EngineerLevel.Executive) {
         statuses = [ComplaintStatus.Escalated, ComplaintStatus.Resolved, ComplaintStatus.Unresolved, ComplaintStatus.Closed]; 
      } else if (complaint.status === ComplaintStatus.Escalated) {
        statuses = [ComplaintStatus.Escalated, ComplaintStatus.Assigned, ComplaintStatus.InProgress, ComplaintStatus.Resolved, ComplaintStatus.Unresolved];
      } else if (complaint.status === ComplaintStatus.Unresolved) {
         statuses = [ComplaintStatus.Unresolved, ComplaintStatus.Escalated, ComplaintStatus.PendingAssignment, ComplaintStatus.Assigned];
      }
      setAvailableStatuses(statuses);

    } else {
      setEngineersForAssignment(allEngineers);
      setAvailableStatuses(Object.values(ComplaintStatus));
    }
  }, [complaint, allEngineers, allUsers]);

  if (!complaint) return null;

  const handleSave = () => {
    if (!adminUser) {
      toast({ title: "Error", description: "Admin user not found. Cannot save changes.", variant: "destructive" });
      return;
    }
    
    const finalSelectedEngineerId = selectedEngineerId === UNASSIGNED_VALUE ? undefined : selectedEngineerId;
    const assignedEngineerDetails = finalSelectedEngineerId ? allUsers.find(e => e.id === finalSelectedEngineerId) : undefined;

    let newStatus = currentStatus || complaint.status;
    let newPriority = selectedPriority || complaint.priority;
    let newResolutionDetails = complaint.resolutionDetails;
    let newResolvedAt = complaint.resolvedAt;
    let newNotes = complaint.internalNotes || [];

    if (finalSelectedEngineerId && 
        (newStatus === ComplaintStatus.PendingAssignment || 
         newStatus === ComplaintStatus.Submitted || 
         newStatus === ComplaintStatus.Unresolved ||
         newStatus === ComplaintStatus.Reopened || 
         newStatus === ComplaintStatus.Escalated)) {
      newStatus = ComplaintStatus.Assigned;
    } else if (!finalSelectedEngineerId && newStatus === ComplaintStatus.Assigned) {
      newStatus = ComplaintStatus.PendingAssignment;
    }
    
    if (currentStatus === ComplaintStatus.Reopened && complaint.status !== ComplaintStatus.Reopened) {
      newPriority = ComplaintPriorityEnum.High; 
      newResolutionDetails = undefined; 
      newResolvedAt = undefined; 
      newNotes.push({
        id: `note-adminreopen-${Date.now()}`,
        userId: adminUser.id,
        userName: adminUser.name,
        text: `Complaint reopened by admin. Original status: ${complaint.status}.`,
        timestamp: new Date(),
        isInternal: false, 
      });
      if (!finalSelectedEngineerId) newStatus = ComplaintStatus.PendingAssignment;
    }

    if (currentStatus === ComplaintStatus.Closed && complaint.status !== ComplaintStatus.Closed) {
      if (!complaint.resolvedAt && complaint.status === ComplaintStatus.Resolved) {
        newResolvedAt = new Date(); 
      }
      newNotes.push({
        id: `note-adminclose-${Date.now()}`,
        userId: adminUser.id,
        userName: adminUser.name,
        text: `Complaint closed by admin. Previous status: ${complaint.status}.`,
        timestamp: new Date(),
        isInternal: true
      });
    }
    
    const updatedComplaintData: Complaint = {
      ...complaint,
      priority: newPriority,
      assignedTo: finalSelectedEngineerId,
      assignedToName: assignedEngineerDetails?.name,
      currentHandlerLevel: assignedEngineerDetails?.engineerLevel,
      status: newStatus,
      resolutionTimeline: resolutionTimeline ? new Date(resolutionTimeline) : undefined,
      resolvedAt: newResolvedAt,
      resolutionDetails: newResolutionDetails,
      updatedAt: new Date(),
      internalNotes: internalNote
        ? [
            ...newNotes,
            {
              id: `note-${Date.now()}`,
              userId: adminUser.id,
              userName: adminUser.name,
              text: internalNote,
              timestamp: new Date(),
              isInternal: true
            },
          ]
        : newNotes,
    };
    
    updateMockComplaint(complaint.id, updatedComplaintData); 
    onUpdateComplaint(updatedComplaintData); 
    toast({ title: "Complaint Updated", description: `Complaint #${complaint.id.slice(-6)} has been updated.` });
    onClose();
  };

  const handleEscalateAction = () => {
    if (!complaint || !adminUser) return;

    const isAlreadyMaxLevel = complaint.currentHandlerLevel === EngineerLevel.Executive;
    const isUnresolvedByMaxLevel = complaint.status === ComplaintStatus.Unresolved && isAlreadyMaxLevel;

    if (isUnresolvedByMaxLevel) {
      toast({ title: "Escalation Blocked", description: "Cannot escalate further. Complaint unresolved by Executive Engineer.", variant: "destructive" });
      return;
    }
    
    let nextLevel: EngineerLevel | undefined = undefined;
    if (complaint.currentHandlerLevel) {
        const currentLevelIndex = engineerLevelOrder.indexOf(complaint.currentHandlerLevel);
        if (currentLevelIndex < engineerLevelOrder.length - 1) {
            nextLevel = engineerLevelOrder[currentLevelIndex + 1];
        } else {
            toast({ title: "Max Level Reached", description: "Complaint is already at the highest engineer level.", variant: "default" });
            setCurrentStatus(ComplaintStatus.Escalated);
            setSelectedPriority(ComplaintPriorityEnum.Escalated);
            setSelectedEngineerId(UNASSIGNED_VALUE); 
            setEngineersForAssignment(allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive));
            return;
        }
    }

    const escalatedComplaint: Complaint = {
      ...complaint,
      status: ComplaintStatus.Escalated,
      priority: ComplaintPriorityEnum.Escalated, 
      updatedAt: new Date(),
      internalNotes: [
        ...(complaint.internalNotes || []),
        {
          id: `note-escalate-${Date.now()}`,
          userId: adminUser.id,
          userName: adminUser.name,
          text: `Complaint escalated by admin. ${nextLevel ? `Targeting ${nextLevel} level.` : 'Marked as escalated.'} Original status: ${complaint.status}.`,
          timestamp: new Date(),
          isInternal: true
        },
      ],
      assignedTo: undefined, 
      assignedToName: undefined,
      currentHandlerLevel: undefined, 
    };
    updateMockComplaint(complaint.id, escalatedComplaint);
    onUpdateComplaint(escalatedComplaint);
    setCurrentStatus(ComplaintStatus.Escalated); 
    setSelectedPriority(ComplaintPriorityEnum.Escalated);
    setSelectedEngineerId(UNASSIGNED_VALUE);
    setEngineersForAssignment(allEngineers.filter(eng => 
        eng.engineerLevel && nextLevel && engineerLevelOrder.indexOf(eng.engineerLevel) >= engineerLevelOrder.indexOf(nextLevel)
    ));
    toast({ title: "Complaint Escalated", description: `Complaint #${complaint.id.slice(-6)} is now ${ComplaintStatus.Escalated}. Please assign to an appropriate ${nextLevel || ''} engineer.` });
  };
  
  const canEscalate = complaint && 
    ![ComplaintStatus.Closed, ComplaintStatus.Resolved].includes(complaint.status) &&
    !(complaint.currentHandlerLevel === EngineerLevel.Executive && complaint.status !== ComplaintStatus.Unresolved);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        Ensure DialogContent has a max-height and overflow-y-auto.
        The main content div inside will take up the available space and scroll if needed.
      */}
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
           <DialogDescription className="flex items-center gap-2 pt-1 text-sm">
            <span>Manage complaint status, priority, assignment, and add internal notes.</span>
            <Badge variant="outline">{complaint.status}</Badge>
            {complaint.assignedToName && complaint.currentHandlerLevel && (
              <span className="text-xs">(Handler: {complaint.assignedToName} - {complaint.currentHandlerLevel})</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* This div will handle the scrolling for the content between header and footer */}
        <div className="flex-1 overflow-y-auto p-6"> {/* Added p-6 for consistent padding */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Complaint Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Customer:</strong> {complaint.customerName}</p>
                  <p><strong>Category:</strong> {complaint.category}</p>
                  <p><strong>Submitted:</strong> {format(new Date(complaint.submittedAt), "PPpp")}</p>
                  <div className="flex items-center">
                    <strong>Current Priority:</strong>&nbsp;
                    <Badge 
                        variant={(complaint.priority === ComplaintPriorityEnum.High || complaint.priority === ComplaintPriorityEnum.Escalated) ? "destructive" : "secondary"} 
                        className="ml-1"
                    >
                      {complaint.priority || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 p-2 bg-secondary rounded-md whitespace-pre-wrap">{complaint.description}</p>
                  </div>
                  {complaint.resolutionDetails && (
                    <div>
                      <strong className="block mb-1">Resolution Notes (from Engineer):</strong>
                      <p className="mt-1 p-2 bg-secondary rounded-md text-sm whitespace-pre-wrap">{complaint.resolutionDetails}</p>
                    </div>
                  )}
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div>
                      <strong>Attachments:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {complaint.attachments.map(att => (
                          <li key={att.id} className="text-primary hover:underline text-xs">
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
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Set Status</Label>
                     <Select value={currentStatus} onValueChange={(value) => setCurrentStatus(value as ComplaintStatus)}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                             (complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) ?
                            <SelectItem value="no_eligible_engineers" disabled>No eligible higher-level engineers</SelectItem>
                            : <SelectItem value="no_engineers" disabled>No engineers available for this status</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {(complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && complaint.assignedTo && engineersForAssignment.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">No higher-level engineers available for current escalation path. Ensure Executive engineers are registered.</p>
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
                  <CardHeader><CardTitle className="text-md">Notes History</CardTitle></CardHeader>
                  <CardContent className="max-h-48 overflow-y-auto space-y-2 text-xs p-4">
                    {complaint.internalNotes.filter(note => note.isInternal || adminUser?.role === UserRole.Admin).slice().reverse().map(note => (
                      <div key={note.id} className={`p-2 rounded ${note.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-secondary'}`}>
                        <p className="font-semibold">
                          {note.userName} 
                          {note.isInternal && <Badge variant="outline" className="ml-2 text-xs bg-yellow-100 text-yellow-700 border-yellow-300">Internal</Badge>}
                          <span className="font-normal text-muted-foreground"> ({format(new Date(note.timestamp), "PP p")})</span>:
                        </p>
                        <p className="whitespace-pre-wrap">{note.text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-2">
            {canEscalate && (
              <Button variant="destructive" onClick={handleEscalateAction} className="w-full sm:w-auto">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Escalate Complaint
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    