
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Complaint, ComplaintAttachment } from "@/types";
import { ComplaintCategory, ComplaintStatus } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { UploadCloud } from "lucide-react";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"];

const formSchema = z.object({
  category: z.nativeEnum(ComplaintCategory, {
    required_error: "Please select a category.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(2000, { message: "Description must not exceed 2000 characters."}),
  attachments: z
    .custom<FileList>((val) => val instanceof FileList, "Please upload a file list")
    .optional()
    .refine(
      (files) => !files || Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
      `Max file size is 5MB.`
    )
    .refine(
      (files) => !files || Array.from(files).every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      "Only .jpg, .jpeg, .png, .gif, .pdf, .txt files are allowed."
    ),
});

interface SubmitComplaintFormProps {
  onComplaintSubmitted: (complaint: Complaint) => void;
}

// Helper function to read file as Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export function SubmitComplaintForm({ onComplaintSubmitted }: SubmitComplaintFormProps) {
  const { user } = useAuth();
  const [fileNames, setFileNames] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
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
    if (!user) {
      alert("User not logged in!");
      return;
    }

    const processedAttachments: ComplaintAttachment[] = [];
    if (values.attachments && values.attachments.length > 0) {
      for (const file of Array.from(values.attachments)) {
        try {
          const dataUrl = await readFileAsDataURL(file);
          console.log(`[SubmitComplaintForm] Processed file ${file.name}, dataUrl starts with: ${dataUrl.substring(0,30)}`);
          processedAttachments.push({
            id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fileName: file.name,
            fileType: file.type,
            url: dataUrl,
          });
        } catch (error) {
          console.error("Error reading file:", file.name, error);
          // Optionally, show a toast to the user about the failed file
        }
      }
    }

    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerId: user.id,
      customerName: user.name,
      category: values.category,
      description: values.description,
      submittedAt: new Date(),
      updatedAt: new Date(),
      status: ComplaintStatus.Submitted,
      attachments: processedAttachments,
    };
    console.log("[SubmitComplaintForm] New complaint object:", JSON.stringify(newComplaint, (key, value) => key === 'url' && typeof value === 'string' && value.length > 100 ? value.substring(0,100) + '...' : value, 2));


    onComplaintSubmitted(newComplaint);
    form.reset();
    setFileNames([]);
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Submit New Complaint</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a complaint category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ComplaintCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please include all relevant details, like dates, times, product names, or people involved.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachments"
              render={() => (
                <FormItem>
                  <FormLabel>Supporting Documents/Images (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted border-input">
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
                              id="dropzone-file" 
                              type="file" 
                              className="hidden" 
                              onChange={handleFileChange} 
                              multiple
                              accept={ALLOWED_FILE_TYPES.join(",")}
                            />
                        </label>
                    </div> 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" className="w-full sm:w-auto">Submit Complaint</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
