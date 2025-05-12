
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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      if (user && user.id) {
        console.log("[CustomerDashboardPage][useEffect] Attempting to fetch complaints for user.id:", user.id, "User object:", JSON.stringify(user));
        setIsLoadingComplaints(true);
        let userComplaintsFromService: Complaint[] = [];
        try {
          if (typeof user.id !== 'string' || user.id.trim() === '') {
            console.error("[CustomerDashboardPage][useEffect] Invalid user.id encountered:", user.id, ". Skipping fetch.");
            setMyComplaints([]);
            setIsLoadingComplaints(false);
            return;
          }
          userComplaintsFromService = await getUserComplaints(user.id);
          console.log("[CustomerDashboardPage][useEffect] getUserComplaints returned:", JSON.stringify(userComplaintsFromService, null, 2), "Count:", userComplaintsFromService.length);
          
          // Validate data before setting state
          if (Array.isArray(userComplaintsFromService)) {
            const validComplaints = userComplaintsFromService.filter(c => c && typeof c.id === 'string');
             if(validComplaints.length !== userComplaintsFromService.length) {
                console.warn("[CustomerDashboardPage][useEffect] Some complaints were filtered out due to missing ID or being null. Original count:", userComplaintsFromService.length, "Valid count:", validComplaints.length);
            }
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
      } else if (!authLoading && !user) {
        console.log("[CustomerDashboardPage][useEffect] No user authenticated or user.id missing. Clearing complaints and not fetching.");
        setMyComplaints([]);
        setIsLoadingComplaints(false);
      } else if (!authLoading && user && !user.id) {
        console.warn("[CustomerDashboardPage][useEffect] User object exists but user.id is missing:", JSON.stringify(user), ". Clearing complaints.");
        setMyComplaints([]);
        setIsLoadingComplaints(false);
      }
    }

    if (!authLoading) {
      console.log("[CustomerDashboardPage][useEffect] Auth loading finished. Current User:", user ? user.id : 'No user', "Role:", user?.role, "IsLoadingComplaints initially:", isLoadingComplaints);
      // Only fetch if user and user.id are present
      if (user && user.id) {
        fetchComplaints();
      } else {
         console.log("[CustomerDashboardPage][useEffect] Auth loaded, but no user/user.id, so not fetching complaints.");
         setIsLoadingComplaints(false); // Ensure loading is false if not fetching
         setMyComplaints([]); // Clear complaints if user becomes null
      }
    } else {
      console.log("[CustomerDashboardPage][useEffect] Auth still loading...");
    }
  }, [user, authLoading, toast]); // user.id is implicitly part of 'user' dependency.

  const handleComplaintSubmitted = async (newComplaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt'>) => {
    console.log("[CustomerDashboardPage][handleComplaintSubmitted] Submitting data:", JSON.stringify(newComplaintData));
    const addedComplaint = await addComplaint(newComplaintData);
    if (addedComplaint) {
      console.log("[CustomerDashboardPage][handleComplaintSubmitted] Complaint added:", JSON.stringify(addedComplaint));
      // Add to the beginning of the list and ensure it's a valid complaint object
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


  if (authLoading) { // Simplified loading check for initial auth
    console.log("[CustomerDashboardPage][Render] Auth is loading. Showing main loading screen...");
    return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;
  }
  
  // console.log("[CustomerDashboardPage][Render] Page rendering. authLoading:", authLoading, "isLoadingComplaints:", isLoadingComplaints, "user:", user?.id, "myComplaints count:", myComplaints.length);


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
             if (user && user.id && user.name) { // Ensure user.name is also available
                const fullData = {
                    ...data,
                    customerId: user.id,
                    customerName: user.name, // Make sure user.name is populated
                    status: ComplaintStatus.Submitted, 
                };
                handleComplaintSubmitted(fullData);
            } else {
                console.error("[CustomerDashboardPage][SubmitComplaintForm] Cannot submit, user details incomplete:", user);
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
                <DropdownMenuCheckboxItem onCheckedChange={() => setStatusFilter([])} className="text-destructive">
                  Clear Filters
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoadingComplaints && !authLoading ? ( 
         <p>Loading complaints list...</p> // More specific loading text
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
        </div>
      )}
    </div>
  );
}

