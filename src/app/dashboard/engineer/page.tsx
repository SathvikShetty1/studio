
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { getAllMockComplaints, updateMockComplaint } from '@/lib/mock-data';
import { ComplaintTableEngineer } from '@/components/engineer/complaint-table-engineer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function EngineerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const { toast } = useToast();

  const fetchComplaintsForEngineer = () => {
    if (user && user.id) {
      console.log(`[EngineerDashboardPage] Fetching complaints for engineer: ${user.id}`);
      setIsLoadingComplaints(true);
      const allComplaints = getAllMockComplaints();
      const engineerComplaints = allComplaints.filter(c => c.assignedTo === user.id);
      console.log(`[EngineerDashboardPage] Found ${engineerComplaints.length} complaints for engineer ${user.id}`);
      setAssignedComplaints(engineerComplaints);
      setIsLoadingComplaints(false);
    } else {
      console.log("[EngineerDashboardPage] No user or user.id, clearing complaints.");
      setAssignedComplaints([]);
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'engineer') {
      console.log(`[EngineerDashboardPage][useEffect] Triggered. AuthLoading: false, User available: true, Engineer ID (user.id if available): ${user?.id}`);
      fetchComplaintsForEngineer();
    } else if (!authLoading) {
      // If auth is done loading but no engineer user, clear complaints and stop loading.
      console.warn(`[EngineerDashboardPage][useEffect] Auth loaded, but user is not an engineer or no user. Role: ${user?.role}, User available: ${!!user}`);
      setAssignedComplaints([]);
      setIsLoadingComplaints(false);
    } else {
      console.log("[EngineerDashboardPage][useEffect] Auth still loading or user not yet available...");
    }
  }, [user, authLoading]);

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    // Optimistic update: Update UI immediately
    setAssignedComplaints(prevComplaints =>
      prevComplaints.map(c =>
        c.id === updatedComplaint.id ? updatedComplaint : c
      )
    );

    const success = updateMockComplaint(updatedComplaint.id, updatedComplaint);
    if (success) {
      toast({
        title: "Complaint Updated",
        description: `Complaint #${updatedComplaint.id.slice(-6)} status changed to ${updatedComplaint.status}.`,
      });
      // Optionally, if you want to ensure data consistency even after optimistic update,
      // you can re-fetch, but for localStorage it might be redundant if updateMockComplaint is synchronous and reliable.
      // fetchComplaintsForEngineer(); 
    } else {
       toast({
        title: "Update Failed",
        description: `Could not update complaint #${updatedComplaint.id.slice(-6)}. Re-fetching data.`,
        variant: "destructive",
      });
      // Re-fetch if update fails to ensure UI reflects the true state
      fetchComplaintsForEngineer();
    }
  };
    
  const stats = {
      total: assignedComplaints.length,
      pending: assignedComplaints.filter(c => c.status === ComplaintStatus.Assigned || c.status === ComplaintStatus.InProgress || c.status === ComplaintStatus.Unresolved).length,
      resolved: assignedComplaints.filter(c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed).length,
  };

  if (authLoading || (isLoadingComplaints && user?.role === 'engineer')) {
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
      {isLoadingComplaints && !authLoading ? (
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
