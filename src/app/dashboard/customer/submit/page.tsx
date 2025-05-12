
"use client";

import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import type { Complaint } from '@/types'; // Omit for data to be passed
import { ComplaintStatus } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addComplaint } from '@/services/complaintService'; // Import the service

export default function SubmitComplaintPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // This page essentially duplicates functionality in CustomerDashboardPage if that page shows the form inline.
  // Consider if this dedicated page is still needed or if form should only be on dashboard.
  // For now, I'll keep it and make it work.

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!user) {
    // This should ideally be handled by the AuthProvider redirecting
    // but as a fallback:
    if (typeof window !== 'undefined') router.push('/login');
    return <p>Redirecting to login...</p>;
  }

  const handleComplaintSubmitted = async (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt' | 'customerId' | 'customerName' | 'status'>) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to submit a complaint.", variant: "destructive"});
        return;
    }
    const fullComplaintData = {
        ...complaintData,
        customerId: user.id,
        customerName: user.name,
        status: ComplaintStatus.Submitted,
        // submittedAt and updatedAt will be handled by serverTimestamp in addComplaint
    };

    const addedComplaint = await addComplaint(fullComplaintData);
    
    if (addedComplaint) {
        toast({
            title: "Complaint Submitted!",
            description: `Your complaint #${addedComplaint.id.slice(-6)} has been successfully submitted.`,
        });
        router.push('/dashboard/customer'); // Redirect to customer dashboard after submission
    } else {
        toast({
            title: "Submission Failed",
            description: "There was an error submitting your complaint. Please try again.",
            variant: "destructive",
        });
    }
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
