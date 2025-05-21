
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ComplaintTableEngineer } from '@/components/engineer/complaint-table-engineer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function EngineerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  const fetchComplaintsForEngineerAPI = useCallback(async (currentUserId?: string) => {
    const idToFetch = currentUserId || user?.id;
    if (!idToFetch) {
      console.log("[EngineerDashboardPage] fetchComplaintsForEngineerAPI: No user ID, cannot fetch.");
      setAssignedComplaints([]);
      setIsLoadingComplaints(false);
      return;
    }
    
    console.log(`[EngineerDashboardPage][fetchComplaintsForEngineerAPI] Attempting to fetch complaints for engineer ID: ${idToFetch}`);
    setIsLoadingComplaints(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/complaints?assignedTo=${idToFetch}&role=engineer`);
      if (response.ok) {
        const complaintsData: Complaint[] = await response.json();
        console.log(`[EngineerDashboardPage][fetchComplaintsForEngineerAPI] Successfully fetched complaints:`, complaintsData.length, complaintsData);
        setAssignedComplaints(complaintsData);
      } else {
        const errorData = await response.json();
        console.error(`[EngineerDashboardPage][fetchComplaintsForEngineerAPI] Failed to fetch complaints for engineer ${idToFetch}:`, response.status, errorData.message);
        toast({ title: "Error", description: `Could not fetch your assigned complaints: ${errorData.message || 'Server error'}`, variant: "destructive" });
        setAssignedComplaints([]);
      }
    } catch (error) {
      console.error(`[EngineerDashboardPage][fetchComplaintsForEngineerAPI] Network or other error for engineer ${idToFetch}:`, error);
      toast({ title: "Error", description: "A network error occurred while fetching your complaints.", variant: "destructive" });
      setAssignedComplaints([]);
    } finally {
      setIsLoadingComplaints(false);
      setIsRefreshing(false);
      console.log("[EngineerDashboardPage][fetchComplaintsForEngineerAPI] Finished fetching.");
    }
  }, [user?.id, toast]);

  useEffect(() => {
    console.log("[EngineerDashboardPage][useEffect for user/authLoading] Triggered. User ID:", user?.id, "AuthLoading:", authLoading);
    if (!authLoading && user && user.role === 'engineer' && user.id) {
      fetchComplaintsForEngineerAPI(user.id);
    } else if (!authLoading && user && user.role !== 'engineer') {
      console.warn("[EngineerDashboardPage][useEffect] Auth loaded, but user is not an engineer. Role:", user.role);
      setAssignedComplaints([]);
      setIsLoadingComplaints(false);
    } else if (authLoading) {
        console.log("[EngineerDashboardPage][useEffect] Auth still loading...");
    } else if (!user) {
        console.warn("[EngineerDashboardPage][useEffect] Auth loaded, but no user object found.");
        setAssignedComplaints([]);
        setIsLoadingComplaints(false);
    }
  }, [user, authLoading, fetchComplaintsForEngineerAPI]);

  const handleUpdateComplaint = async (updatedComplaint: Complaint) => {
    // The modal now calls the API directly. This function will re-fetch to update the table.
    console.log("[EngineerDashboardPage] handleUpdateComplaint triggered. Re-fetching engineer complaints.");
    if (user && user.id) {
      await fetchComplaintsForEngineerAPI(user.id);
    }
    // Toast is handled by the modal on successful API update
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

  if (authLoading) {
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
            <div className="text-2xl font-bold">{isLoadingComplaints ? "..." : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingComplaints ? "..." : stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingComplaints ? "..." : stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />
      {isLoadingComplaints && !isRefreshing ? (
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
