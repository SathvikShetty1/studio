
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ComplaintTableAdmin } from '@/components/admin/complaint-table-admin';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, Users, ChevronsUp } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const fetchAllComplaintsAPI = useCallback(async () => {
    console.log("[AdminDashboardPage] fetchAllComplaintsAPI called.");
    setIsLoadingComplaints(true);
    try {
      const response = await fetch('/api/complaints?role=admin'); // Admin fetches all
      if (response.ok) {
        const complaintsData: Complaint[] = await response.json();
        console.log("[AdminDashboardPage] fetchAllComplaintsAPI: Successfully fetched complaints:", complaintsData.length);
        setAllComplaints(complaintsData);
      } else {
        const errorData = await response.json();
        console.error("[AdminDashboardPage] fetchAllComplaintsAPI: Failed to fetch complaints -", response.status, errorData.message);
        toast({ title: "Error", description: `Could not fetch complaints: ${errorData.message || 'Server error'}`, variant: "destructive" });
        setAllComplaints([]);
      }
    } catch (error) {
      console.error("[AdminDashboardPage] fetchAllComplaintsAPI: Network or other error:", error);
      toast({ title: "Error", description: "A network error occurred while fetching complaints.", variant: "destructive" });
      setAllComplaints([]);
    } finally {
      setIsLoadingComplaints(false);
      console.log("[AdminDashboardPage] fetchAllComplaintsAPI finished.");
    }
  }, [toast]);

  useEffect(() => {
     if (!authIsLoading && user && user.role === 'admin') {
      fetchAllComplaintsAPI();
    }
  }, [user, authIsLoading, fetchAllComplaintsAPI]);

  const handleUpdateComplaint = async (updatedComplaint: Complaint) => {
    // The modal now calls the API directly. This function will re-fetch to update the table.
    console.log("[AdminDashboardPage] handleUpdateComplaint triggered. Re-fetching all complaints.");
    await fetchAllComplaintsAPI(); 
    // Toast is shown by the modal after successful API call
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    // The table actions will call the API directly. This function will re-fetch.
    console.log("[AdminDashboardPage] handleDeleteComplaint triggered. Re-fetching all complaints.");
    await fetchAllComplaintsAPI();
    // Toast for deletion should be handled where the API call is made (e.g., in table component or after successful API call here)
  };
  
  const stats = {
    total: allComplaints.length,
    pending: allComplaints.filter(c => 
        c.status === ComplaintStatus.Submitted || 
        c.status === ComplaintStatus.PendingAssignment ||
        c.status === ComplaintStatus.Unresolved ||
        c.status === ComplaintStatus.Reopened
    ).length,
    inProgress: allComplaints.filter(c => 
        c.status === ComplaintStatus.InProgress || 
        c.status === ComplaintStatus.Assigned ||
        c.status === ComplaintStatus.Escalated
    ).length,
    resolved: allComplaints.filter(c => 
        c.status === ComplaintStatus.Resolved || 
        c.status === ComplaintStatus.Closed
    ).length,
    escalated: allComplaints.filter(c => c.status === ComplaintStatus.Escalated).length,
  };

  if (authIsLoading) return <div className="flex items-center justify-center h-screen"><p>Loading user data...</p></div>;
  if (!user || user.role !== 'admin') {
    return <p className="p-4">Access Denied. You must be an admin to view this page.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Complaints Overview</h1>
        <p className="text-muted-foreground">Manage all customer complaints, assign tasks, and monitor resolution progress.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingComplaints ? "..." : stats.inProgress}</div>
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
         {stats.escalated > 0 && (
          <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Escalated</CardTitle>
              <ChevronsUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{isLoadingComplaints ? "..." : stats.escalated}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />
      {isLoadingComplaints ? (
        <p>Loading complaints...</p>
      ) : (
        <ComplaintTableAdmin 
          complaints={allComplaints} 
          onUpdateComplaint={handleUpdateComplaint} // This will now primarily trigger a re-fetch
          onDeleteComplaint={handleDeleteComplaint} // This will now primarily trigger a re-fetch
        />
      )}
    </div>
  );
}
