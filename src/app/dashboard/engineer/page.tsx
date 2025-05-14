
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ComplaintTableEngineer } from '@/components/engineer/complaint-table-engineer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, RefreshCw, Inbox } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { getEngineerComplaints, updateComplaint as updateComplaintService } from '@/services/complaintService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function EngineerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAssignedComplaints = async () => {
    if (user && user.id) { 
      if(!isRefreshing) setIsLoadingComplaints(true); else setIsRefreshing(true);
      console.log(`[EngineerDashboardPage][fetchAssignedComplaints] Attempting to fetch complaints for engineer ID (user.id): ${user.id}`);
      try {
        const engineerComplaints = await getEngineerComplaints(user.id);
        console.log(`[EngineerDashboardPage][fetchAssignedComplaints] getEngineerComplaints returned (raw):`, JSON.stringify(engineerComplaints, null, 2), "Count:", engineerComplaints.length);
        
        if (Array.isArray(engineerComplaints)) {
          const validComplaints = engineerComplaints.filter(c => c && typeof c.id === 'string');
           if(validComplaints.length !== engineerComplaints.length) {
              console.warn("[EngineerDashboardPage][fetchAssignedComplaints] Some complaints were filtered out due to missing ID or being null. Original count:", engineerComplaints.length, "Valid count:", validComplaints.length);
          }
          setAssignedComplaints(validComplaints);
          console.log("[EngineerDashboardPage][fetchAssignedComplaints] Final assignedComplaints state:", JSON.stringify(validComplaints, null, 2));
        } else {
          console.error("[EngineerDashboardPage][fetchAssignedComplaints] getEngineerComplaints did not return an array. Received:", engineerComplaints);
          setAssignedComplaints([]);
           toast({
              title: "Data Error",
              description: "Received unexpected data format for assigned complaints.",
              variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`[EngineerDashboardPage][fetchAssignedComplaints] Error during fetch for engineer ${user.id}:`, error);
        toast({ title: "Error", description: "Could not fetch your assigned complaints.", variant: "destructive" });
        setAssignedComplaints([]); 
      } finally {
        setIsLoadingComplaints(false);
        setIsRefreshing(false);
        console.log("[EngineerDashboardPage][fetchAssignedComplaints] Finished fetching. isLoadingComplaints/isRefreshing set to false.");
      }
    } else {
      console.warn("[EngineerDashboardPage][fetchAssignedComplaints] User or user.id not available. Skipping fetch.");
      setIsLoadingComplaints(false); 
      setIsRefreshing(false);
      setAssignedComplaints([]); 
    }
  };

  useEffect(() => {
    console.log(`[EngineerDashboardPage][useEffect] Triggered. AuthLoading: ${authLoading}, User available: ${!!user}, Engineer ID (user.id if available): ${user?.id || 'N/A'}`);
    if (!authLoading && user && user.role === 'engineer') {
      console.log("[EngineerDashboardPage][useEffect] Auth loaded. Engineer user identified. User object:", JSON.stringify(user, null, 2));
      fetchAssignedComplaints();
    } else if (!authLoading && user && user.role !== 'engineer') {
      console.warn("[EngineerDashboardPage][useEffect] Auth loaded, but user is not an engineer. Role:", user.role);
      setIsLoadingComplaints(false);
      setAssignedComplaints([]);
    } else if (authLoading) {
      console.log("[EngineerDashboardPage][useEffect] Auth still loading...");
    } else if (!user) {
      console.warn("[EngineerDashboardPage][useEffect] Auth loaded, but no user object found.");
      setIsLoadingComplaints(false);
      setAssignedComplaints([]);
    }
  }, [user, authLoading]);

  const handleUpdateComplaint = async (updatedComplaint: Complaint) => {
    const originalComplaints = [...assignedComplaints];
    setAssignedComplaints(prevComplaints =>
      prevComplaints.map(c => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
    
    const success = await updateComplaintService(updatedComplaint.id, updatedComplaint);
    if (!success) {
      setAssignedComplaints(originalComplaints); 
      toast({ title: "Update Failed", description: "Could not update complaint in the database.", variant: "destructive"});
    } else {
      // Re-fetch to ensure data consistency after an update.
      await fetchAssignedComplaints(); 
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

  if (authLoading || (isLoadingComplaints && user && !isRefreshing) ) {
    return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;
  }
  if (!user || user.role !== 'engineer') {
    return <p className="p-4">Access Denied. You must be an engineer to view this page.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Assigned Complaints</h1>
          <p className="text-muted-foreground">Update status and manage resolutions for your assigned customer complaints.</p>
        </div>
        <Button onClick={fetchAssignedComplaints} disabled={isRefreshing || isLoadingComplaints}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || isLoadingComplaints ? 'animate-spin' : ''}`} />
          {isRefreshing || isLoadingComplaints ? 'Refreshing...' : 'Refresh Complaints'}
        </Button>
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
      { (isLoadingComplaints && !isRefreshing) ? (
        <div className="flex items-center justify-center py-10">
            <p>Loading assigned complaints...</p>
        </div>
      ) : assignedComplaints.length > 0 ? (
        <ComplaintTableEngineer 
          complaints={assignedComplaints} 
          onUpdateComplaint={handleUpdateComplaint}
        />
      ) : (
        <div className="text-center py-10 border rounded-md shadow-sm">
          <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No Complaints Assigned
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You currently have no complaints assigned to you.
          </p>
          <Button onClick={fetchAssignedComplaints} disabled={isRefreshing || isLoadingComplaints} className="mt-4">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || isLoadingComplaints ? 'animate-spin' : ''}`} />
             Check for New Assignments
          </Button>
        </div>
      )}
    </div>
  );
}
