
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Complaint, User as UserTypeFE } from '@/types'; // Renamed User to UserTypeFE to avoid conflict with Mongoose Model
import { ComplaintStatus, ComplaintPriority as ComplaintPriorityEnum, EngineerLevel, UserRole } from '@/types';
// Removed mock-data imports
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
// ScrollArea component removed for direct CSS scrolling
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
  onUpdateComplaint: (updatedComplaint: Complaint) => void; // Callback after successful API update
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<UserTypeFE[]>([]); // Store all users fetched from API
  const allEngineers = useMemo(() => allUsers.filter(u => u.role === UserRole.Engineer), [allUsers]);
  const [engineersForAssignment, setEngineersForAssignment] = useState<UserTypeFE[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<ComplaintStatus[]>(Object.values(ComplaintStatus));

  useEffect(() => {
    // Fetch all users once when modal might open or users list is needed
    const fetchAllSystemUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if(response.ok) {
                const usersData: UserTypeFE[] = await response.json();
                setAllUsers(usersData);
            } else {
                toast({title: "Error", description: "Failed to load user list for assignment.", variant: "destructive"});
            }
        } catch (error) {
            toast({title: "Error", description: "Network error loading user list.", variant: "destructive"});
            console.error("Failed to fetch system users for modal:", error);
        }
    };
    if (isOpen) { // Fetch users if modal is open and users not loaded
        fetchAllSystemUsers();
    }
  }, [isOpen, toast]);


  useEffect(() => {
    if (complaint) {
      setCurrentStatus(complaint.status);
      setSelectedPriority(complaint.priority);
      setSelectedEngineerId(complaint.assignedTo || UNASSIGNED_VALUE);
      setResolutionTimeline(complaint.resolutionTimeline ? format(new Date(complaint.resolutionTimeline), "yyyy-MM-dd") : '');
      setInternalNote('');

      let displayEngineers = [...allEngineers]; // Use state `allEngineers` which is populated from API
      if ((complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && complaint.assignedTo) {
        const currentAssignee = allUsers.find(u => u.id === complaint.assignedTo);
        if (currentAssignee && currentAssignee.role === UserRole.Engineer && currentAssignee.engineerLevel) {
          const currentLevelIndex = engineerLevelOrder.indexOf(currentAssignee.engineerLevel);
          if (currentLevelIndex < engineerLevelOrder.length - 1) {
            displayEngineers = allEngineers.filter(eng =>
              eng.engineerLevel && engineerLevelOrder.indexOf(eng.engineerLevel) > currentLevelIndex
            );
          } else {
             displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive && eng.id !== currentAssignee.id);
             if (displayEngineers.length === 0) { 
                 displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive);
             }
          }
        }
      } else if (complaint.status === ComplaintStatus.Escalated && !complaint.assignedTo) {
        displayEngineers = allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Senior || eng.engineerLevel === EngineerLevel.Executive);
      } else if ([ComplaintStatus.PendingAssignment, ComplaintStatus.Reopened, ComplaintStatus.Submitted].includes(complaint.status)) {
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
  }, [complaint, allEngineers, allUsers]); // allUsers dependency added

  const handleSave = async () => {
    if (!adminUser || !complaint) {
      toast({ title: "Error", description: "Admin user or complaint not found. Cannot save.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    const finalSelectedEngineerId = selectedEngineerId === UNASSIGNED_VALUE ? undefined : selectedEngineerId;
    const assignedEngineerDetails = finalSelectedEngineerId ? allUsers.find(e => e.id === finalSelectedEngineerId) : undefined;

    let newStatus = currentStatus || complaint.status;
    let newPriority = selectedPriority || complaint.priority;
    let newResolutionDetails = complaint.resolutionDetails;
    let newResolvedAt = complaint.resolvedAt;
    let newNotes = complaint.internalNotes ? [...complaint.internalNotes] : []; // Ensure array
    let newCurrentHandlerLevel = assignedEngineerDetails?.engineerLevel || complaint.currentHandlerLevel;

    if (finalSelectedEngineerId && 
        (newStatus === ComplaintStatus.PendingAssignment || 
         newStatus === ComplaintStatus.Submitted || 
         newStatus === ComplaintStatus.Unresolved ||
         newStatus === ComplaintStatus.Reopened || 
         newStatus === ComplaintStatus.Escalated)) {
      newStatus = ComplaintStatus.Assigned;
    } else if (!finalSelectedEngineerId && newStatus === ComplaintStatus.Assigned) {
      newStatus = ComplaintStatus.PendingAssignment;
      newCurrentHandlerLevel = undefined; 
    }
    
    if (currentStatus === ComplaintStatus.Reopened && complaint.status !== ComplaintStatus.Reopened) {
      newPriority = ComplaintPriorityEnum.High; 
      newResolutionDetails = undefined; 
      newResolvedAt = undefined; 
      newNotes.push({
        // id will be auto-generated by DB for subdocument
        id: `note-frontend-${Date.now()}`, // temp frontend id
        userId: adminUser.id, // This is MongoDB _id string
        userName: adminUser.name,
        text: `Complaint reopened by admin. Original status: ${complaint.status}.`,
        timestamp: new Date(),
        isInternal: false, 
      });
      if (!finalSelectedEngineerId) newStatus = ComplaintStatus.PendingAssignment;
      else newStatus = ComplaintStatus.Assigned;
    }

    if (currentStatus === ComplaintStatus.Closed && complaint.status !== ComplaintStatus.Closed) {
      if (!complaint.resolvedAt && complaint.status === ComplaintStatus.Resolved) {
        newResolvedAt = new Date(); 
      }
      newNotes.push({
        id: `note-frontend-${Date.now()}`,
        userId: adminUser.id,
        userName: adminUser.name,
        text: `Complaint closed by admin. Previous status: ${complaint.status}.`,
        timestamp: new Date(),
        isInternal: true
      });
    }
    
    if (internalNote.trim()) {
        newNotes.push({
            id: `note-frontend-${Date.now()}`,
            userId: adminUser.id,
            userName: adminUser.name,
            text: internalNote,
            timestamp: new Date(),
            isInternal: true,
        });
    }
    
    const updatePayload = {
      priority: newPriority,
      assignedTo: finalSelectedEngineerId, // This is MongoDB _id string
      assignedToName: assignedEngineerDetails?.name,
      currentHandlerLevel: newCurrentHandlerLevel,
      status: newStatus,
      resolutionTimeline: resolutionTimeline ? new Date(resolutionTimeline).toISOString() : undefined,
      resolvedAt: newResolvedAt ? new Date(newResolvedAt).toISOString() : undefined,
      resolutionDetails: newResolutionDetails,
      internalNotes: newNotes.map(note => ({ // map to exclude frontend 'id' if not needed by backend for subdoc updates
          userId: note.userId,
          userName: note.userName,
          text: note.text,
          timestamp: note.timestamp,
          isInternal: note.isInternal,
      })),
      // updatedAt will be handled by server/DB
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
            toast({ title: "Update Failed", description: errorData.message || "Could not update complaint.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error updating complaint:", error);
        toast({ title: "Network Error", description: "Failed to connect to server.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEscalateAction = async () => {
    if (!complaint || !adminUser) return;
    setIsSubmitting(true);

    const isAlreadyMaxLevel = complaint.currentHandlerLevel === EngineerLevel.Executive;
    const isUnresolvedByMaxLevel = complaint.status === ComplaintStatus.Unresolved && isAlreadyMaxLevel;

    if (isUnresolvedByMaxLevel) {
      toast({ title: "Escalation Blocked", description: "Cannot escalate further. Complaint unresolved by Executive Engineer.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    let nextLevel: EngineerLevel | undefined = undefined;
    if (complaint.currentHandlerLevel) {
        const currentLevelIndex = engineerLevelOrder.indexOf(complaint.currentHandlerLevel);
        if (currentLevelIndex < engineerLevelOrder.length - 1) {
            nextLevel = engineerLevelOrder[currentLevelIndex + 1];
        } else {
             toast({ title: "Max Level", description: "Complaint is already at Executive level. Marking as 'Escalated'.", variant: "default" });
             // No API call needed if just updating local state before full save
             setCurrentStatus(ComplaintStatus.Escalated);
             setSelectedPriority(ComplaintPriorityEnum.Escalated);
             setEngineersForAssignment(allEngineers.filter(eng => eng.engineerLevel === EngineerLevel.Executive));
             setIsSubmitting(false); // Allow save button to be used for this change
             return; // Don't make separate API call for this scenario immediately
        }
    } else {
      nextLevel = EngineerLevel.Junior; // Default escalation level if none assigned
    }

    const escalatePayload = {
      status: ComplaintStatus.Escalated,
      priority: ComplaintPriorityEnum.Escalated, 
      assignedTo: undefined, // Unassign for re-assignment
      assignedToName: undefined,
      currentHandlerLevel: undefined, // Will be set upon new assignment
      internalNotes: [
        ...(complaint.internalNotes || []).map(note => ({
            userId: note.userId, userName: note.userName, text: note.text, timestamp: note.timestamp, isInternal: note.isInternal
        })),
        {
          userId: adminUser.id,
          userName: adminUser.name,
          text: `Complaint escalated by admin. ${nextLevel ? `Targeting ${nextLevel} level or higher.` : 'Marked as escalated.'} Original status: ${complaint.status}.`,
          timestamp: new Date(),
          isInternal: true
        },
      ],
    };
    
    try {
        const response = await fetch(`/api/complaints/${complaint.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(escalatePayload),
        });
        if (response.ok) {
            const updatedComplaintData = await response.json();
            onUpdateComplaint(updatedComplaintData); // Update parent state
            // Update local modal state to reflect escalation for assignment
            setCurrentStatus(ComplaintStatus.Escalated); 
            setSelectedPriority(ComplaintPriorityEnum.Escalated);
            setSelectedEngineerId(UNASSIGNED_VALUE);
            setEngineersForAssignment(allEngineers.filter(eng => 
                eng.engineerLevel && nextLevel && engineerLevelOrder.indexOf(eng.engineerLevel) >= engineerLevelOrder.indexOf(nextLevel)
            ));
            toast({ title: "Complaint Escalated", description: `Complaint #${complaint.id.slice(-6)} is now ${ComplaintStatus.Escalated}. Please assign to an appropriate ${nextLevel || ''} engineer.` });
            // onClose(); // Optionally close modal or keep open for reassignment
        } else {
            const errorData = await response.json();
            toast({ title: "Escalation Failed", description: errorData.message || "Could not escalate complaint.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Error escalating complaint:", error);
        toast({ title: "Network Error", description: "Failed to connect to server for escalation.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const canEscalate = complaint && 
    ![ComplaintStatus.Closed, ComplaintStatus.Resolved].includes(complaint.status) &&
    !(complaint.currentHandlerLevel === EngineerLevel.Executive && complaint.status !== ComplaintStatus.Unresolved);

  if (!isOpen || !complaint) return null; // Keep this check

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <DialogTitle>Complaint Details: #{complaint.id.slice(-6)}</DialogTitle>
           <DialogDescription className="flex items-center gap-2 pt-1 text-sm">
            <span>Manage complaint status, priority, assignment, and add internal notes.</span>
            <Badge variant="outline">{currentStatus || complaint.status}</Badge>
            {complaint.assignedToName && complaint.currentHandlerLevel && (
              <span className="text-xs">(Handler: {complaint.assignedToName} - {complaint.currentHandlerLevel})</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6"> {/* This div handles scrolling */}
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
                        variant={(selectedPriority === ComplaintPriorityEnum.High || selectedPriority === ComplaintPriorityEnum.Escalated) ? "destructive" : "secondary"} 
                        className="ml-1"
                    >
                      {selectedPriority || complaint.priority || "N/A"}
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
                        {complaint.attachments.map(att => {
                          console.log("[AdminModal] Rendering attachment. ID:", att.id, "URL:", att.url?.substring(0,50) + "...");
                          return (
                            <li key={att.id} className="text-primary hover:underline text-xs">
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                <Paperclip className="h-3 w-3 mr-1.5 inline-block flex-shrink-0" /> {att.fileName}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                       <p className="text-xs text-muted-foreground mt-1">Attachment URL Length (example first attachment): {complaint.attachments[0]?.url?.length}</p>
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
                            : <SelectItem value="no_engineers" disabled>No engineers available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {(complaint.status === ComplaintStatus.Unresolved || complaint.status === ComplaintStatus.Escalated) && complaint.assignedTo && engineersForAssignment.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">No higher-level engineers available. Ensure Executive engineers are registered.</p>
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
                  <CardContent className="space-y-2 text-xs p-4"> {/* Removed max-h and overflow */}
                    {complaint.internalNotes.filter(note => note.isInternal || adminUser?.role === UserRole.Admin).slice().reverse().map(note => (
                      <div key={note.id || `note-${note.timestamp.getTime()}`} className={`p-2 rounded ${note.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-secondary'}`}>
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
              <Button variant="destructive" onClick={handleEscalateAction} className="w-full sm:w-auto" disabled={isSubmitting}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                {isSubmitting ? "Escalating..." : "Escalate Complaint"}
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSave} className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
