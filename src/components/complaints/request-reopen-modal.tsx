
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
import type { ComplaintAttachment } from '@/types';

const formSchema = z.object({
  reason: z.string().min(10, {
    message: "Reopen reason must be at least 10 characters.",
  }).max(1000, { message: "Reopen reason must not exceed 1000 characters."}),
  attachments: z.custom<FileList>((val) => val instanceof FileList, "Please upload a file list").optional(),
});

interface RequestReopenModalProps {
  complaintId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReopen: (complaintId: string, reason: string, newAttachments: ComplaintAttachment[]) => void;
}

export function RequestReopenModal({ complaintId, isOpen, onClose, onSubmitReopen }: RequestReopenModalProps) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const names = Array.from(files).map(file => file.name);
      setFileNames(names);
      form.setValue("attachments", files); // Set the FileList object for react-hook-form
    } else {
      setFileNames([]);
      form.setValue("attachments", undefined);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!complaintId) return;

    const newAttachments: ComplaintAttachment[] = [];
    if (values.attachments) {
      Array.from(values.attachments).forEach(file => {
        // In a real app, you'd upload the file and get a URL.
        // For localStorage, we'll just store the name and a placeholder URL.
        newAttachments.push({
          id: `attach-reopen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileType: file.type,
          url: '#placeholder-reopen-attachment', // Placeholder URL
        });
      });
    }
    onSubmitReopen(complaintId, values.reason, newAttachments);
    form.reset();
    setFileNames([]);
    onClose();
  }

  if (!isOpen || !complaintId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
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
              render={() => ( // field is not directly used for file input value
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
                              <p className="text-xs text-muted-foreground">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
                            </>
                          )}
                        </div>
                        <Input id="reopen-dropzone-file" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.txt" />
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    You can upload multiple files.
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
              }}>Cancel</Button>
              <Button type="submit">Submit Reopen Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
