
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Complaint, ComplaintAttachment } from '@/types';
import { ComplaintCategory } from "@/types";
// useAuth is removed, as user info should be passed by the parent page or retrieved via onComplaintSubmitted callback.
import { UploadCloud } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  category: z.nativeEnum(ComplaintCategory, {
    required_error: "Please select a category.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(2000, { message: "Description must not exceed 2000 characters."}),
  attachments: z.any().optional(), 
});

// The props now expect a function that will handle the full complaint object creation
// including customerId, customerName, etc., which are available on the parent page context.
interface SubmitComplaintFormProps {
  onComplaintSubmitted: (data: Pick<Complaint, 'category' | 'description' | 'attachments'>) => void;
}

export function SubmitComplaintForm({ onComplaintSubmitted }: SubmitComplaintFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: undefined, // Ensure category has a default or is explicitly set
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const complaintDataToPass: Pick<Complaint, 'category' | 'description' | 'attachments'> = {
      category: values.category,
      description: values.description,
      attachments: fileName ? [{ id: `attach-${Date.now()}`, fileName: fileName, fileType: 'unknown', url: '#' }] : [],
    };

    await onComplaintSubmitted(complaintDataToPass);
    
    form.reset({category: undefined, description: "", attachments: undefined});
    setFileName(null);
    setIsSubmitting(false);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileName(event.target.files[0].name);
      // In a real app, you'd handle the upload here and get a URL
      // For now, we're just storing the name.
    } else {
      setFileName(null);
    }
  };

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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
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
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel>Supporting Documents/Images (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted border-input">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                {fileName ? (
                                  <p className="text-sm text-foreground"><span className="font-semibold">Selected:</span> {fileName}</p>
                                ) : (
                                  <>
                                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
                                  </>
                                )}
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.txt" />
                        </label>
                    </div> 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
