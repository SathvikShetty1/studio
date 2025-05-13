"use client";

import { useState, useEffect } from 'react';
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
import { addComplaint, getUserComplaints } from '@/services/complaintService';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDashboardPage() {
  const { user, firebaseUser, isLoading: authLoading } = useAuth(); 
  const { toast } = useToast();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      console.log("[CustomerDashboardPage][useEffect] Initiating fetchComplaints. FirebaseUser UID:", firebaseUser?.uid);

      if (!firebaseUser || !firebaseUser.uid) {
        console.warn("[CustomerDashboardPage][useEffect] firebaseUser or firebaseUser.uid is missing. Skipping fetch. UID:", firebaseUser?.uid);
        setMyComplaints([]);
        setIsLoadingComplaints(false);
        return;
      }
      
      console.log("[CustomerDashboardPage][useEffect] Attempting to fetch complaints for firebaseUser.uid:", firebaseUser.uid);
      setIsLoadingComplaints(true);
      let userComplaintsFromService: Complaint[] = [];
      try {
        userComplaintsFromService = await getUserComplaints(firebaseUser.uid);
        console.log("[CustomerDashboardPage][useEffect] getUserComplaints returned (raw):", JSON.stringify(userComplaintsFromService, null, 2), "Count:", userComplaintsFromService?.length);
        
        if (Array.isArray(userComplaintsFromService)) {
          const validComplaints = userComplaintsFromService.filter(c => c && typeof c.id === 'string');
           if(validComplaints.length !== userComplaintsFromService.length) {
              console.warn("[CustomerDashboardPage][useEffect] Some complaints were filtered out due to missing ID or being null. Original count:", userComplaintsFromService.length, "Valid count:", validComplaints.length);
          }
          console.log("[CustomerDashboardPage][useEffect] Valid complaints after filtering on page:", JSON.stringify(validComplaints, null, 2));
          console.log("[CustomerDashboardPage][useEffect] About to setMyComplaints with:", JSON.stringify(validComplaints, null, 2), "Count:", validComplaints.length);
          setMyComplaints(validComplaints);
        } else {
          console.error("[CustomerDashboardPage][useEffect] getUserComplaints did not return an array. Received:", userComplaintsFromService);
          setMyComplaints([]);
           toast({
              title: "Data Error",
              description: "Received unexpected data format for complaints.",
              variant: "destructive",
          });
        }

      } catch (error) {
        console.error("[CustomerDashboardPage][useEffect] Error during fetchComplaints:", error);
        setMyComplaints([]); 
        toast({
          title: "Error Fetching Complaints",
          description: "Could not load your complaints. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingComplaints(false); 
        console.log("[CustomerDashboardPage][useEffect] Finished fetching complaints. isLoadingComplaints set to false.");
      }
    }

    if (!authLoading) {
      console.log("[CustomerDashboardPage][useEffect] Auth loading finished. Current Firebase User UID:", firebaseUser ? firebaseUser.uid : 'No firebaseUser', "App User Role:", user?.role, "IsLoadingComplaints initially:", isLoadingComplaints);
      console.log("Calling getUserComplaints with userId:", firebaseUser?.uid); 
      fetchComplaints(); 
    } else {
      console.log("[CustomerDashboardPage][useEffect] Auth still loading...");
    }
  }, [firebaseUser?.uid, authLoading, user?.role, toast]); // Added toast to dependencies

  const handleComplaintSubmitted = async (newComplaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt'>) => {
    console.log("[CustomerDashboardPage][handleComplaintSubmitted] Submitting data:", JSON.stringify(newComplaintData));
    if (!firebaseUser || !firebaseUser.uid) {
        toast({ title: "Error", description: "User not authenticated properly.", variant: "destructive" });
        return;
    }
    const completeComplaintData = {
        ...newComplaintData,
        customerId: firebaseUser.uid, 
    };

    const addedComplaint = await addComplaint(completeComplaintData);
    if (addedComplaint) {
      console.log("[CustomerDashboardPage][handleComplaintSubmitted] Complaint added:", JSON.stringify(addedComplaint));
      setMyComplaints(prev => [addedComplaint, ...prev].filter(c => c && c.id)); 
      setShowSubmitForm(false);
      toast({
          title: "Complaint Submitted!",
          description: `Your complaint has been successfully submitted.`,
      });
    } else {
      console.error("[CustomerDashboardPage][handleComplaintSubmitted] Failed to add complaint.");
      toast({
          title: "Submission Failed",
          description: "There was an error submitting your complaint. Please try again.",
          variant: "destructive",
      });
    }
  };
  
  const filteredComplaints = myComplaints.filter(complaint => 
    statusFilter.length === 0 || (complaint && statusFilter.includes(complaint.status))
  );
  console.log("[CustomerDashboardPage][Render] Filtered complaints count:", filteredComplaints.length, "Original myComplaints count:", myComplaints.length, "Filters:", statusFilter);


  if (authLoading) { 
    console.log("[CustomerDashboardPage][Render] Auth is loading. Showing main loading screen...");
    return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;
  }
  
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
          <SubmitComplaintForm onComplaintSubmitted={(data) => {
             if (user && user.name && firebaseUser && firebaseUser.uid) { 
                const fullData = {
                    ...data,
                    customerId: firebaseUser.uid, 
                    customerName: user.name, 
                    status: ComplaintStatus.Submitted, 
                };
                handleComplaintSubmitted(fullData);
            } else {
                console.error("[CustomerDashboardPage][SubmitComplaintForm] Cannot submit, user details incomplete. App User:", user, "Firebase User:", firebaseUser);
                toast({title: "Cannot Submit", description: "User details are incomplete. Please try logging out and in again.", variant: "destructive"});
            }
          }} />
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
                <DropdownMenuCheckboxItem onCheckedChange={() => setStatusFilter([])} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  Clear Filters
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoadingComplaints && !authLoading ? ( 
         <p>Loading complaints list...</p> 
      ) : filteredComplaints.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredComplaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">
            {myComplaints.length === 0 ? "No complaints filed yet." : "No complaints match current filters."}
          </h3>
          {myComplaints.length === 0 && !showSubmitForm && (
             <p className="mt-1 text-sm text-muted-foreground">
              Ready to submit your first complaint? Click the button above.
            </p>
          )}
          {console.log("[CustomerDashboardPage][Render] Displaying empty state. myComplaints length:", myComplaints.length, "filteredComplaints length:", filteredComplaints.length, "isLoadingComplaints:", isLoadingComplaints, "authLoading:", authLoading)}
        </div>
      )}
    </div>
  );
}
