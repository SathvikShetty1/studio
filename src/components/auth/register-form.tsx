
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types";
import { UserRole, EngineerLevel } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserDetails } from '@/services/userService';


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.nativeEnum(UserRole).default(UserRole.Customer),
  engineerLevel: z.nativeEnum(EngineerLevel).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => data.role !== UserRole.Engineer || (data.role === UserRole.Engineer && !!data.engineerLevel), {
  message: "Engineer level is required for engineer role.",
  path: ["engineerLevel"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.Customer,
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      const userDetails: Omit<User, 'id'> = {
        name: values.name,
        email: values.email,
        role: values.role,
        avatar: `https://picsum.photos/seed/${values.email}/40/40`, 
        ...(values.role === UserRole.Engineer && { engineerLevel: values.engineerLevel }),
      };

      const detailsStored = await createUserDetails(firebaseUser.uid, userDetails);

      if (!detailsStored) {
        toast({
          title: "Registration Partially Failed",
          description: "Account created, but failed to save all user details to the database. Please contact support.",
          variant: "destructive",
        });
        // Optionally, consider deleting the Firebase Auth user here if Firestore write fails
        // await firebaseUser.delete();
        setIsLoading(false);
        return;
      }

      toast({
        title: "Registration Successful!",
        description: `User ${values.name} created as a ${values.role}${values.role === UserRole.Engineer ? ` (${values.engineerLevel})` : ''}. You can now log in.`,
      });
      router.push('/login');

    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "An unexpected error occurred during registration. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This email address is already in use. Please try another or log in.";
            break;
          case 'auth/weak-password':
            errorMessage = "The password is too weak. Please choose a stronger password (at least 6 characters).";
            break;
          case 'auth/invalid-api-key':
             errorMessage = "Firebase API Key is invalid. Please ensure your .env.local file is correctly configured with your Firebase project's API Key and that the development server has been restarted.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "A network error occurred. Please check your internet connection and try again.";
            break;
          // Add more specific Firebase error codes as needed
          default:
            // For other Firebase errors, error.message might be more informative
            errorMessage = error.message || errorMessage;
            break;
        }
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>Join Complaint Central to manage your issues effectively.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Register As</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.Customer}>Customer</SelectItem>
                      <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                      <SelectItem value={UserRole.Engineer}>Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRole === UserRole.Engineer && (
              <FormField
                control={form.control}
                name="engineerLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engineer Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select engineer level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(EngineerLevel).map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
