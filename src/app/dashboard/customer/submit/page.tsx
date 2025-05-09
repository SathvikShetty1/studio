"use client";

import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { mockComplaints } from '@/lib/mock-data'; // Assuming mockComplaints is exported and mutable
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SubmitComplaintPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  if (!user) {
    // This should ideally be handled by the AuthProvider redirecting
    // but as a fallback:
    if (typeof window !== 'undefined') router.push('/login');
    return <p>Redirecting to login...</p>;
  }

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    // Add to the global mock data store (in a real app, this would be an API call)
    mockComplaints.unshift(newComplaint);
    toast({
        title: "Complaint Submitted!",
        description: `Your complaint #${newComplaint.id} has been successfully submitted.`,
    });
    router.push('/dashboard/customer'); // Redirect to customer dashboard after submission
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">File a New Complaint</h1>
        <p className="text-muted-foreground">
          Please provide as much detail as possible about your issue.
        </p>
      </div>
      <SubmitComplaintForm onComplaintSubmitted={handleComplaintSubmitted} />
    </div>
  );
}
