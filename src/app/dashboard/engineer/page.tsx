
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ComplaintTableEngineer } from '@/components/engineer/complaint-table-engineer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { getEngineerComplaints, updateComplaint as updateComplaintService } from '@/services/complaintService';
import { useToast } from '@/hooks/use-toast';

export default function EngineerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const fetchAssignedComplaints = async () => {
    if (user && user.id) { // Ensure user and user.id are available
      setIsLoadingComplaints(true);
      console.log(`[EngineerDashboardPage] Fetching complaints for engineer ID: ${user.id}`);
      try {
        const engineerComplaints = await getEngineerComplaints(user.id);
        console.log(`[EngineerDashboardPage] Received ${engineerComplaints.length} complaints for engineer ${user.id}:`, engineerComplaints);
        setAssignedComplaints(engineerComplaints);
      } catch (error) {
        console.error(`[EngineerDashboardPage] Error fetching complaints for engineer ${user.id}:`, error);
        toast({ title: "Error", description: "Could not fetch your assigned complaints.", variant: "destructive" });
        setAssignedComplaints([]); // Set to empty array on error
      } finally {
        setIsLoadingComplaints(false);
      }
    } else {
      console.warn("[EngineerDashboardPage] User or user.id not available for fetching complaints.");
      setIsLoadingComplaints(false); // Ensure loading state is reset
      setAssignedComplaints([]); // Ensure complaints are empty if no user
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'engineer') {
      fetchAssignedComplaints();
    }
  }, [user, authLoading]); // user.id is not needed here as user object change will trigger it

  const handleUpdateComplaint = async (updatedComplaint: Complaint) => {
    const originalComplaints = [...assignedComplaints];
    // Optimistically update UI
    setAssignedComplaints(prevComplaints =>
      prevComplaints.map(c => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
    
    const success = await updateComplaintService(updatedComplaint.id, updatedComplaint);
    if (!success) {
      setAssignedComplaints(originalComplaints); // Revert on failure
      toast({ title: "Update Failed", description: "Could not update complaint in the database.", variant: "destructive"});
    } else {
      // Re-fetch to ensure data consistency, especially if status change might affect filtering
      // For engineer, updating often means it's resolved or needs admin attention, so re-fetch is good.
      await fetchAssignedComplaints(); 
      // toast({ title: "Complaint Updated", description: `Complaint #${updatedComplaint.id.slice(-6)} updated.`});
    }
  };
    
  const stats = {
      total: assignedComplaints.length,
      pending: assignedComplaints.filter(c => 
        c.status === ComplaintStatus.Assigned || 
        c.status === ComplaintStatus.InProgress ||
        c.status === ComplaintStatus.Unresolved 
      ).length,
      resolved: assignedComplaints.filter(c => 
        c.status === ComplaintStatus.Resolved || 
        c.status === ComplaintStatus.Closed
      ).length,
  };

  if (authLoading || (isLoadingComplaints && user) ) {
    return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;
  }
  if (!user || user.role !== 'engineer') {
    return <p className="p-4">Access Denied. You must be an engineer to view this page.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Assigned Complaints</h1>
        <p className="text-muted-foreground">Update status and manage resolutions for your assigned customer complaints.</p>
      </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />
      {isLoadingComplaints ? (
        <p>Loading assigned complaints...</p>
      ) : (
        <ComplaintTableEngineer 
          complaints={assignedComplaints} 
          onUpdateComplaint={handleUpdateComplaint}
        />
      )}
    </div>
  );
}

