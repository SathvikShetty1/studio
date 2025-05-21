
"use client";

import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import type { Complaint } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SubmitComplaintPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Toast is now handled by SubmitComplaintForm

  if (!user) {
    // AuthProvider handles redirection, but this is a fallback
    if (typeof window !== 'undefined') router.push('/login');
    return <p>Redirecting to login...</p>;
  }

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    // The SubmitComplaintForm now handles API call and toast.
    // This callback can be used for redirection or other parent component logic.
    console.log("[SubmitComplaintPage] Complaint successfully submitted by form:", newComplaint.id);
    router.push('/dashboard/customer'); // Redirect to customer dashboard
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
