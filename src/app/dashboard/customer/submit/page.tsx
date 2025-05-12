
"use client";

import { SubmitComplaintForm } from '@/components/complaints/submit-complaint-form';
import type { Complaint } from '@/types'; // Omit for data to be passed
import { ComplaintStatus } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addComplaint } from '@/services/complaintService'; // Import the service

export default function SubmitComplaintPage() {
  const { user, firebaseUser, isLoading: authLoading } = useAuth(); // Add firebaseUser
  const router = useRouter();
  const { toast } = useToast();

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!firebaseUser) { // Check firebaseUser for auth status
    if (typeof window !== 'undefined') router.push('/login');
    return <p>Redirecting to login...</p>;
  }

  const handleComplaintSubmitted = async (complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt' | 'customerId' | 'customerName' | 'status'>) => {
    // user from useAuth is for Firestore data (name, role). firebaseUser is for Auth (uid).
    if (!firebaseUser || !firebaseUser.uid || !user || !user.name) { 
        toast({ title: "Error", description: "User details incomplete. Please ensure you are fully logged in.", variant: "destructive"});
        return;
    }
    const fullComplaintData = {
        ...complaintData,
        customerId: firebaseUser.uid, // Use firebaseUser.uid
        customerName: user.name, // Use user.name from Firestore data
        status: ComplaintStatus.Submitted,
    };

    const addedComplaint = await addComplaint(fullComplaintData);
    
    if (addedComplaint) {
        toast({
            title: "Complaint Submitted!",
            description: `Your complaint #${addedComplaint.id.slice(-6)} has been successfully submitted.`,
        });
        router.push('/dashboard/customer'); 
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
