
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockComplaints as initialMockComplaints } from '@/lib/mock-data';
import { ComplaintTableAdmin } from '@/components/admin/complaint-table-admin';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, Users, ChevronsUp } from 'lucide-react'; // Added ChevronsUp for Escalated
import { ComplaintStatus } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  // Initialize with a copy of the current state of initialMockComplaints
  const [allComplaints, setAllComplaints] = useState<Complaint[]>(() => [...initialMockComplaints]);

  // Effect to update `allComplaints` if the source array's content (any complaint object) changes,
  // or if its length changes (e.g., new complaint added/deleted).
  useEffect(() => {
    // This creates a shallow copy. If mockComplaints objects are mutated directly elsewhere,
    // this might not pick up changes if the array reference itself or length doesn't change.
    // A more robust way would be to deep compare or use a version/timestamp if objects are complex.
    // For this mock setup, we assume mockComplaints array itself is the source of truth that gets modified.
    setAllComplaints([...initialMockComplaints]);
  }, [initialMockComplaints, initialMockComplaints.length]); // React to additions/deletions and content changes if the array reference changes

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    // Update the global mock data first
    const index = initialMockComplaints.findIndex(c => c.id === updatedComplaint.id);
    if (index !== -1) {
      initialMockComplaints[index] = updatedComplaint;
      // Trigger re-render by creating a new array reference for state
      setAllComplaints([...initialMockComplaints]);
    } else {
      // If somehow the complaint is new (should not happen via this handler)
      initialMockComplaints.unshift(updatedComplaint);
      setAllComplaints([...initialMockComplaints]);
    }
  };

  const handleDeleteComplaint = (complaintId: string) => {
    const newComplaintsList = initialMockComplaints.filter(c => c.id !== complaintId)
    // Update global mock data first by replacing its contents
    initialMockComplaints.length = 0; // Clear array
    initialMockComplaints.push(...newComplaintsList); // Repopulate
    
    setAllComplaints([...initialMockComplaints]); // Update local state
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
        c.status === ComplaintStatus.Assigned ||
        c.status === ComplaintStatus.Escalated
    ).length,
    resolved: allComplaints.filter(c => 
        c.status === ComplaintStatus.Resolved || 
        c.status === ComplaintStatus.Closed
    ).length,
    escalated: allComplaints.filter(c => c.status === ComplaintStatus.Escalated).length,
  };


  if (!user || user.role !== 'admin') {
    // Should be handled by AuthProvider & layout, but as a safeguard:
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
         {stats.escalated > 0 && (
          <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Escalated</CardTitle>
              <ChevronsUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.escalated}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      <ComplaintTableAdmin 
        complaints={allComplaints} 
        onUpdateComplaint={handleUpdateComplaint}
        onDeleteComplaint={handleDeleteComplaint}
      />
    </div>
  );
}
