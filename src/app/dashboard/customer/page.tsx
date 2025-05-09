"use client";

import { useState, useEffect } from 'react';
import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import { ComplaintCard } from '@/components/complaints/complaint-card';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockComplaints as allMockComplaints } from '@/lib/mock-data';
import { PlusCircle, ListFilter, ShieldAlert } from 'lucide-react'; // Added ShieldAlert
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


export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus[]>([]);

  useEffect(() => {
    if (user) {
      // Simulate fetching user's complaints
      const userComplaints = allMockComplaints.filter(c => c.customerId === user.id);
      setMyComplaints(userComplaints);
    }
  }, [user]);

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    setMyComplaints(prev => [newComplaint, ...prev]);
    allMockComplaints.unshift(newComplaint); // Add to global mock for other roles to see
    setShowSubmitForm(false);
  };
  
  const filteredComplaints = myComplaints.filter(complaint => 
    statusFilter.length === 0 || statusFilter.includes(complaint.status)
  );

  if (!user) return <p>Loading user data or please login.</p>;

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
                <DropdownMenuCheckboxItem onCheckedChange={() => setStatusFilter([])} className="text-destructive">
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
