
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import { ComplaintCard } from '@/components/complaints/complaint-card';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
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
import { RequestReopenModal } from '@/components/complaints/request-reopen-modal';

export default function CustomerDashboardPage() {
  const { user, isLoading: authIsLoading, fetchUserDetails } = useAuth();
  const { toast } = useToast();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopeningComplaintId, setReopeningComplaintId] = useState<string | null>(null);

  const fetchMyComplaintsAPI = useCallback(async (currentUserId?: string) => {
    const idToFetch = currentUserId || user?.id;
    if (!idToFetch) {
      console.log("[CustomerDashboardPage] fetchMyComplaintsAPI: No user ID, cannot fetch.");
      setMyComplaints([]);
      setIsLoadingComplaints(false);
      return;
    }

    console.log("[CustomerDashboardPage] fetchMyComplaintsAPI called for user ID:", idToFetch);
    setIsLoadingComplaints(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/complaints?customerId=${idToFetch}&role=customer`);
      if (response.ok) {
        const complaintsData: Complaint[] = await response.json();
        console.log("[CustomerDashboardPage] fetchMyComplaintsAPI: Successfully fetched complaints:", complaintsData.length, complaintsData);
        setMyComplaints(complaintsData);
      } else {
        const errorData = await response.json();
        console.error("[CustomerDashboardPage] fetchMyComplaintsAPI: Failed to fetch complaints -", response.status, errorData.message);
        toast({ title: "Error", description: `Could not fetch your complaints: ${errorData.message || 'Server error'}`, variant: "destructive" });
        setMyComplaints([]);
      }
    } catch (error) {
      console.error("[CustomerDashboardPage] fetchMyComplaintsAPI: Network or other error:", error);
      toast({ title: "Error", description: "A network error occurred while fetching your complaints.", variant: "destructive" });
      setMyComplaints([]);
    } finally {
      setIsLoadingComplaints(false);
      setIsRefreshing(false);
      console.log("[CustomerDashboardPage] fetchMyComplaintsAPI finished.");
    }
  }, [user?.id, toast]); // Dependency on user.id and toast

  useEffect(() => {
    console.log("[CustomerDashboardPage][useEffect for user/authLoading] Triggered. User ID:", user?.id, "AuthLoading:", authIsLoading);
    if (!authIsLoading && user && user.id) {
      fetchMyComplaintsAPI(user.id);
    } else if (!authIsLoading && !user) {
      console.log("[CustomerDashboardPage][useEffect for user/authLoading] No user, clearing complaints.");
      setMyComplaints([]);
      setIsLoadingComplaints(false);
    }
  }, [user, authIsLoading, fetchMyComplaintsAPI]);

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    console.log("[CustomerDashboardPage] handleComplaintSubmitted triggered by form for complaint:", newComplaint.id);
    // API call already made by SubmitComplaintForm, just refresh list
    fetchMyComplaintsAPI(); 
    setShowSubmitForm(false);
    // Toast already shown by SubmitComplaintForm
  };

  const openReopenModal = (complaintId: string) => {
    setReopeningComplaintId(complaintId);
    setIsReopenModalOpen(true);
  };
  
  const handleReopenSuccess = (updatedComplaint: Complaint) => {
    console.log("[CustomerDashboardPage] handleReopenSuccess called with updated complaint:", updatedComplaint.id);
    fetchMyComplaintsAPI(); // Re-fetch all complaints to update the list
    setIsReopenModalOpen(false);
    setReopeningComplaintId(null);
    // Toast already shown by RequestReopenModal
  };
  
  const filteredComplaints = myComplaints.filter(complaint => 
    statusFilter.length === 0 || statusFilter.includes(complaint.status)
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (authIsLoading) return <div className="flex items-center justify-center h-screen"><p>Loading user data...</p></div>;
  if (!user && !authIsLoading) return <div className="p-4">Please login to view your dashboard.</div>;
  // isLoadingComplaints is handled within the main return block for better UX

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Complaints Dashboard</h1>
          <p className="text-muted-foreground">View your submitted complaints and their status, or file a new one.</p>
        </div>
        <Button onClick={() => setShowSubmitForm(prev => !prev)} disabled={isRefreshing}>
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
        <h2 className="text-xl font-semibold">My Complaint History ({isRefreshing ? "..." : filteredComplaints.length})</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isRefreshing}>
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

      {isLoadingComplaints && !isRefreshing ? (
         <div className="text-center py-10"><p>Loading complaints...</p></div>
      ): filteredComplaints.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredComplaints.map(complaint => (
            <ComplaintCard 
              key={complaint.id} 
              complaint={complaint} 
              onOpenReopenModal={openReopenModal} // This now just opens the modal
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
        </div>
      )}
      <RequestReopenModal
        isOpen={isReopenModalOpen}
        onClose={() => {
            setIsReopenModalOpen(false);
            setReopeningComplaintId(null);
        }}
        onReopenSuccess={handleReopenSuccess}
        complaintId={reopeningComplaintId}
      />
    </div>
  );
}
