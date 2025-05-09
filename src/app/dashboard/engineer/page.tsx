"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockComplaints as initialMockComplaints } from '@/lib/mock-data';
import { ComplaintTableEngineer } from '@/components/engineer/complaint-table-engineer';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks } from 'lucide-react';
import { ComplaintStatus } from '@/types';

export default function EngineerDashboardPage() {
  const { user } = useAuth();
  // Initialize state by filtering from the global mock data
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>(() => {
    if (user) {
      return initialMockComplaints.filter(c => c.assignedTo === user.id);
    }
    return [];
  });

  // Effect to re-filter and update `assignedComplaints` if the source array's length changes
  // or if the user changes.
  useEffect(() => {
    if (user) {
      const engineerComplaints = initialMockComplaints.filter(c => c.assignedTo === user.id);
      setAssignedComplaints(engineerComplaints);
    } else {
      setAssignedComplaints([]); // Clear if no user
    }
  }, [initialMockComplaints.length, user]); // React to source data changes and user changes

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    // Update local state first for immediate UI feedback
    setAssignedComplaints(prevComplaints =>
      prevComplaints.map(c => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
    
    // Also update the global mock data (in a real app, this would be an API call)
    const index = initialMockComplaints.findIndex(c => c.id === updatedComplaint.id);
    if (index !== -1) {
      initialMockComplaints[index] = updatedComplaint;
    }
    // If status changes, it might affect assignedComplaints list, re-filter from source.
    // This also ensures that if an engineer resolves a complaint, and it's filtered out by status,
    // the assignedComplaints list is updated.
    if (user) {
        const currentEngineerComplaints = initialMockComplaints.filter(c => c.assignedTo === user.id);
        setAssignedComplaints(currentEngineerComplaints);
    }
  };
    
  const stats = {
      total: assignedComplaints.length,
      pending: assignedComplaints.filter(c => c.status === ComplaintStatus.Assigned || c.status === ComplaintStatus.InProgress).length,
      resolved: assignedComplaints.filter(c => c.status === ComplaintStatus.Resolved || c.status === ComplaintStatus.Closed).length,
  };

  if (!user || user.role !== 'engineer') {
    // Should be handled by AuthProvider & layout, but as a safeguard:
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

      <ComplaintTableEngineer 
        complaints={assignedComplaints} 
        onUpdateComplaint={handleUpdateComplaint}
      />
    </div>
  );
}
