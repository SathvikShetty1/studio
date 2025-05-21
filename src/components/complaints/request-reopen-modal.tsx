
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";
import type { ComplaintAttachment } from '@/types'; // Using full ComplaintAttachment type
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth'; // For adding note with current user's name

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"];

const formSchema = z.object({
  reason: z.string().min(10, {
    message: "Reopen reason must be at least 10 characters.",
  }).max(1000, { message: "Reopen reason must not exceed 1000 characters."}),
  attachments: z
    .custom<FileList>((val) => val instanceof FileList, "Please upload a file list")
    .optional()
    .refine(
      (files) => !files || Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
      `Max file size is 5MB per file.`
    )
    .refine(
      (files) => !files || Array.from(files).every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .jpeg, .png, .gif, .pdf, .txt files are allowed."
    ),
});

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
         console.log(`[readFileAsDataURL] FileReader result (first 100 chars): ${reader.result.substring(0, 100)}`);
         console.log(`[readFileAsDataURL] FileReader result length: ${reader.result.length}`);
        resolve(reader.result);
      } else {
        console.error('[readFileAsDataURL] FileReader result was not a string.');
        reject(new Error('FileReader did not return a string.'));
      }
    };
    reader.onerror = (error) => {
      console.error('[readFileAsDataURL] FileReader error:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

interface RequestReopenModalProps {
  complaintId: string | null;
  isOpen: boolean;
  onClose: () => void;
  // onSubmitReopen will now be an async function that directly calls the API
  onReopenSuccess: (updatedComplaint: any) => void; // Callback after successful API update
}

export function RequestReopenModal({ complaintId, isOpen, onClose, onReopenSuccess }: RequestReopenModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      form.setValue("attachments", files);
      setFileNames(Array.from(files).map(file => file.name));
    } else {
      form.setValue("attachments", undefined);
      setFileNames([]);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!complaintId || !user) {
      toast({ title: "Error", description: "Complaint ID or user not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const newAttachmentsData: Omit<ComplaintAttachment, 'id'>[] = [];
    if (values.attachments && values.attachments.length > 0) {
      for (const file of Array.from(values.attachments)) {
         try {
          const dataUrl = await readFileAsDataURL(file);
          console.log(`[RequestReopenModal] Processed file ${file.name}, Data URI Length: ${dataUrl?.length}`);
          newAttachmentsData.push({
            fileName: file.name,
            fileType: file.type,
            url: dataUrl, 
          });
        } catch (error) {
          console.error("Error reading file for reopen:", file.name, error);
          toast({ title: "File Error", description: `Could not process file: ${file.name}`, variant: "destructive" });
        }
      }
    }

    const reopenPayload = {
      status: "Reopened", // Directly set status
      reopenReason: values.reason, // Send reason to API
      newAttachments: newAttachmentsData, // Send attachments to API
      requestingUserId: user.id,
      requestingUserName: user.name,
    };

    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reopenPayload),
      });

      if (response.ok) {
        const updatedComplaint = await response.json();
        toast({ title: "Reopen Requested", description: `Complaint #${complaintId.slice(-6)} has been flagged for reopening.` });
        onReopenSuccess(updatedComplaint); // Callback for parent to update its state
        form.reset();
        setFileNames([]);
        onClose();
      } else {
        const errorData = await response.json();
        toast({ title: "Reopen Failed", description: errorData.message || "Could not request reopen.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting reopen request via API:", error);
      toast({ title: "Network Error", description: "Failed to connect to the server.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !complaintId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => {
      if (!openState) {
        form.reset();
        setFileNames([]);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Request to Reopen Complaint #{complaintId.slice(-6)}</DialogTitle>
          <DialogDescription>
            Please explain why you need to reopen this complaint and attach any new supporting documents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Reopening</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed reason..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachments"
              render={() => ( 
                <FormItem>
                  <FormLabel>New Supporting Documents (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="reopen-dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted border-input">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                          {fileNames.length > 0 ? (
                            <div className="text-sm text-foreground text-center">
                              <p className="font-semibold">Selected:</p>
                              {fileNames.map((name, idx) => <p key={idx} className="text-xs truncate max-w-xs">{name}</p>)}
                            </div>
                          ) : (
                            <>
                              <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">Images, PDF, TXT (MAX. 5MB)</p>
                            </>
                          )}
                        </div>
                        <Input 
                          id="reopen-dropzone-file" 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={handleFileChange} 
                          accept={ALLOWED_FILE_TYPES.join(",")}
                        />
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    You can upload multiple files. Attachments will be added to the existing ones.
                    IMPORTANT: For production apps, consider dedicated file storage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                form.reset();
                setFileNames([]);
                onClose();
              }} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Reopen Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
