
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import { ComplaintCard } from '@/components/complaints/complaint-card';
import type { Complaint, ComplaintNote } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { getAllMockComplaints, addComplaintToMock, updateMockComplaint } from '@/lib/mock-data';
import { PlusCircle, ListFilter, ShieldAlert } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComplaintStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';


export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const fetchMyComplaints = useCallback(() => {
    console.log("[CustomerDashboardPage] fetchMyComplaints called.");
    if (user && user.id) {
      console.log("[CustomerDashboardPage] User found with ID:", user.id);
      setIsLoadingComplaints(true);
      const allComplaints = getAllMockComplaints();
      console.log("[CustomerDashboardPage] Total complaints from getAllMockComplaints:", allComplaints.length, allComplaints);
      const userComplaints = allComplaints.filter(c => c.customerId === user.id);
      console.log("[CustomerDashboardPage] Filtered complaints for user:", userComplaints.length, userComplaints);
      setMyComplaints(userComplaints);
      setIsLoadingComplaints(false);
    } else {
      setMyComplaints([]);
      setIsLoadingComplaints(false);
    }
    console.log("[CustomerDashboardPage] fetchMyComplaints finished.");
  }, [user]);

  useEffect(() => {
    console.log("[CustomerDashboardPage] useEffect for [user] triggered. User:", user?.id);
    fetchMyComplaints();
  }, [user, fetchMyComplaints]);

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    console.log("[CustomerDashboardPage] handleComplaintSubmitted triggered by form on this page for complaint:", newComplaint.id);
    addComplaintToMock(newComplaint); 
    fetchMyComplaints(); 
    setShowSubmitForm(false);
    toast({
      title: "Complaint Submitted!",
      description: `Your complaint #${newComplaint.id.slice(-6)} has been successfully submitted.`,
    });
  };

  const handleRequestReopen = (complaintId: string) => {
    const complaintToReopen = myComplaints.find(c => c.id === complaintId);
    if (complaintToReopen && user) {
      const updatedComplaint: Complaint = {
        ...complaintToReopen,
        status: ComplaintStatus.Reopened,
        updatedAt: new Date(),
        internalNotes: [
          ...(complaintToReopen.internalNotes || []),
          {
            id: `note-reopenreq-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text: "Customer requested to reopen the complaint.",
            timestamp: new Date(),
            isInternal: false, 
          } as ComplaintNote,
        ],
      };
      updateMockComplaint(complaintId, updatedComplaint);
      fetchMyComplaints(); // Refresh the list
      toast({
        title: "Reopen Requested",
        description: `Complaint #${complaintId.slice(-6)} has been flagged for reopening.`,
      });
    }
  };
  
  const filteredComplaints = myComplaints.filter(complaint => 
    statusFilter.length === 0 || statusFilter.includes(complaint.status)
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());


  if (!user) return <div className="flex items-center justify-center h-screen"><p>Loading user data or please login.</p></div>;
  if (isLoadingComplaints) return <div className="flex items-center justify-center h-screen"><p>Loading complaints...</p></div>;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Complaints Dashboard</h1>
          <p className="text-muted-foreground">View your submitted complaints and their status, or file a new one.</p>
        </div>
        <Button onClick={() => setShowSubmitForm(prev => !prev)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {showSubmitForm ? 'Cancel Submission' : 'File New Complaint'}
        </Button>
      </div>

      <Separator />

      {showSubmitForm && (
        <div className="my-6">
          <h2 className="text-xl font-semibold mb-4">Submit a New Complaint</h2>
          <SubmitComplaintForm onComplaintSubmitted={handleComplaintSubmitted} />
          <Separator className="my-6" />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Complaint History ({filteredComplaints.length})</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ListFilter className="mr-2 h-4 w-4" /> Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(ComplaintStatus).map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked ? [...prev, status] : prev.filter(s => s !== status)
                  );
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
             {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem 
                  onCheckedChange={() => setStatusFilter([])} 
                  className="text-sm !text-destructive focus:!text-destructive hover:!bg-destructive/10"
                >
                  Clear Filters
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredComplaints.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredComplaints.map(complaint => (
            <ComplaintCard 
              key={complaint.id} 
              complaint={complaint} 
              onRequestReopen={handleRequestReopen}
              userRole="customer"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">
            {myComplaints.length === 0 && !isLoadingComplaints ? "No complaints filed yet." : "No complaints match current filters."}
          </h3>
          {myComplaints.length === 0 && !showSubmitForm && !isLoadingComplaints && (
             <p className="mt-1 text-sm text-muted-foreground">
              Ready to submit your first complaint? Click the button above.
            </p>
          )}
           {isLoadingComplaints && <p>Checking for complaints...</p>}
        </div>
      )}
    </div>
  );
}
