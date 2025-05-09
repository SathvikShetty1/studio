"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockComplaints as initialMockComplaints } from '@/lib/mock-data';
import { ComplaintTableAdmin } from '@/components/admin/complaint-table-admin';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, Users } from 'lucide-react';
import { ComplaintStatus } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  // Initialize with a copy of the current state of initialMockComplaints
  const [allComplaints, setAllComplaints] = useState<Complaint[]>(() => [...initialMockComplaints]);

  // Effect to update `allComplaints` if the source array's length changes (e.g., new complaint added)
  useEffect(() => {
    setAllComplaints([...initialMockComplaints]);
  }, [initialMockComplaints.length]); // React to additions/deletions

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    setAllComplaints(prevComplaints =>
      prevComplaints.map(c => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
    // Update the global mock data as well
    const index = initialMockComplaints.findIndex(c => c.id === updatedComplaint.id);
    if (index !== -1) {
      initialMockComplaints[index] = updatedComplaint;
    }
  };

  const handleDeleteComplaint = (complaintId: string) => {
    const newComplaints = initialMockComplaints.filter(c => c.id !== complaintId)
    // Update global mock data first
    initialMockComplaints.length = 0; // Clear array
    initialMockComplaints.push(...newComplaints); // Repopulate with filtered complaints
    
    // Then update local state, which will trigger re-render if useEffect for length change doesn't catch it fast enough
    // or if this is the primary action source.
    setAllComplaints([...initialMockComplaints]);
  };
  
  const stats = {
    total: allComplaints.length,
    pending: allComplaints.filter(c => c.status === ComplaintStatus.Submitted || c.status === ComplaintStatus.PendingAssignment).length,
    inProgress: allComplaints.filter(c => c.status === ComplaintStatus.InProgress || c.status === ComplaintStatus.Assigned).length,
    resolved: allComplaints.filter(c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed).length,
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
