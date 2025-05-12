
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { ComplaintTableAdmin } from '@/components/admin/complaint-table-admin';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, Users, ChevronsUp } from 'lucide-react';
import { ComplaintStatus } from '@/types';
import { getAllComplaints, updateComplaint as updateComplaintService, deleteComplaint as deleteComplaintService } from '@/services/complaintService';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const fetchComplaintsData = async () => {
    setIsLoadingComplaints(true);
    const complaintsData = await getAllComplaints();
    setAllComplaints(complaintsData);
    setIsLoadingComplaints(false);
  };
  
  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      fetchComplaintsData();
    }
  }, [user, authLoading]);

  const handleUpdateComplaint = async (updatedComplaint: Complaint) => {
    // Optimistically update UI, then sync with Firestore
    const originalComplaints = [...allComplaints];
    setAllComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
    
    const success = await updateComplaintService(updatedComplaint.id, updatedComplaint);
    if (!success) {
      setAllComplaints(originalComplaints); // Revert on failure
      toast({ title: "Update Failed", description: "Could not update complaint in the database.", variant: "destructive"});
    } else {
        // No need to re-fetch, optimistic update is likely fine or modal closes.
        // If strict consistency needed, uncomment:
        // await fetchComplaintsData(); 
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    const originalComplaints = [...allComplaints];
    setAllComplaints(prev => prev.filter(c => c.id !== complaintId));

    const success = await deleteComplaintService(complaintId);
    if (!success) {
      setAllComplaints(originalComplaints); // Revert on failure
      toast({ title: "Delete Failed", description: "Could not delete complaint from the database.", variant: "destructive"});
    } else {
        toast({ title: "Complaint Deleted", description: `Complaint #${complaintId.slice(-6)} removed.`});
    }
  };
  
  const stats = {
    total: allComplaints.length,
    pending: allComplaints.filter(c => 
        c.status === ComplaintStatus.Submitted || 
        c.status === ComplaintStatus.PendingAssignment ||
        c.status === ComplaintStatus.Unresolved
    ).length,
    inProgress: allComplaints.filter(c => 
        c.status === ComplaintStatus.InProgress || 
        c.status === ComplaintStatus.Assigned
    ).length, // Removed Escalated from here as it's its own stat
    resolved: allComplaints.filter(c => 
        c.status === ComplaintStatus.Resolved || 
        c.status === ComplaintStatus.Closed
    ).length,
    escalated: allComplaints.filter(c => c.status === ComplaintStatus.Escalated).length,
  };


  if (authLoading || (isLoadingComplaints && user)) {
    return <div className="flex items-center justify-center h-screen"><p>Loading dashboard...</p></div>;
  }
  if (!user || user.role !== 'admin') {
    return <p className="p-4">Access Denied. You must be an admin to view this page.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Complaints Overview</h1>
        <p className="text-muted-foreground">Manage all customer complaints, assign tasks, and monitor resolution progress.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"> {/* Adjusted for 5 stats including escalated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
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
         <Card className={stats.escalated > 0 ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stats.escalated > 0 ? "text-destructive": ""}`}>Escalated</CardTitle>
              <ChevronsUp className={`h-4 w-4 ${stats.escalated > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.escalated > 0 ? "text-destructive": ""}`}>{stats.escalated}</div>
            </CardContent>
          </Card>
      </div>

      <Separator />
      {isLoadingComplaints ? (
        <p>Loading complaints table...</p>
      ) : (
        <ComplaintTableAdmin 
          complaints={allComplaints} 
          onUpdateComplaint={handleUpdateComplaint}
          onDeleteComplaint={handleDeleteComplaint}
        />
      )}
    </div>
  );
}
