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
        console.log("[CustomerDashboardPage] Fetching complaints for user.id:", user.id);
        setIsLoadingComplaints(true);
        try {
          const userComplaints = await getUserComplaints(user.id);
          console.log("[CustomerDashboardPage] Received complaints:", JSON.stringify(userComplaints, null, 2));
          setMyComplaints(userComplaints);
        } catch (error) {
          console.error("[CustomerDashboardPage] Failed to fetch user complaints:", error);
          setMyComplaints([]); 
          toast({
            title: "Error Fetching Complaints",
            description: "Could not load your complaints. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingComplaints(false);
        }
      } else if (!authLoading && !user) {
        console.log("[CustomerDashboardPage] No user or user.id, clearing complaints.");
        setMyComplaints([]);
        setIsLoadingComplaints(false);
      } else if (!authLoading && user && !user.id) {
        console.warn("[CustomerDashboardPage] User object exists but user.id is missing:", user);
        setMyComplaints([]);
        setIsLoadingComplaints(false);
      }
    }

    if (!authLoading) {
      console.log("[CustomerDashboardPage] Auth loading finished. User:", user ? user.id : 'No user');
      fetchComplaints();
    } else {
      console.log("[CustomerDashboardPage] Auth still loading...");
    }
  }, [user, authLoading]); 

  const handleComplaintSubmitted = async (newComplaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt'>) => {
    const addedComplaint = await addComplaint(newComplaintData);
    if (addedComplaint) {
      setMyComplaints(prev => [addedComplaint, ...prev]);
      setShowSubmitForm(false);
      toast({
          title: "Complaint Submitted!",
          description: `Your complaint has been successfully submitted.`,
      });
    } else {
      toast({
          title: "Submission Failed",
          description: "There was an error submitting your complaint. Please try again.",
          variant: "destructive",
      });
    }
  };
  
  const filteredComplaints = myComplaints.filter(complaint => 
    statusFilter.length === 0 || statusFilter.includes(complaint.status)
  );

  if (authLoading || (isLoadingComplaints && user)) return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;

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
             if (user) {
                const fullData = {
                    ...data,
                    customerId: user.id,
                    customerName: user.name,
                    status: ComplaintStatus.Submitted, 
                };
                handleComplaintSubmitted(fullData);
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
         <p>Loading complaints...</p>
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
