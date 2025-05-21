
"use client";

import { useState, useEffect } from 'react';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { getAllMockComplaints, updateMockComplaint, deleteMockComplaint } from '@/lib/mock-data';
import { ComplaintTableAdmin } from '@/components/admin/complaint-table-admin';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, ListChecks, Users, ChevronsUp } from 'lucide-react';
import { ComplaintStatus } from '@/types';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllComplaints = () => {
    setIsLoading(true);
    const complaints = getAllMockComplaints();
    setAllComplaints(complaints);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    updateMockComplaint(updatedComplaint.id, updatedComplaint);
    fetchAllComplaints(); // Re-fetch to update the list
  };

  const handleDeleteComplaint = (complaintId: string) => {
    deleteMockComplaint(complaintId);
    fetchAllComplaints(); // Re-fetch to update the list
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
    return <p className="p-4">Access Denied. You must be an admin to view this page.</p>;
  }

  if (isLoading) {
    return <div className="p-4">Loading complaints...</div>;
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
