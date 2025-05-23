
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
// Removed mock-data imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
// TODO: Create a UserFormModal for adding/editing users, which will call API endpoints

export default function ManageUsersPage() {
  const { user: adminUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchAllUsersAPI = useCallback(async () => {
    console.log("[ManageUsersPage] fetchAllUsersAPI called.");
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const usersData: User[] = await response.json();
        console.log("[ManageUsersPage] fetchAllUsersAPI: Successfully fetched users:", usersData.length);
        setUsers(usersData);
      } else {
        const errorData = await response.json();
        console.error("[ManageUsersPage] fetchAllUsersAPI: Failed to fetch users -", response.status, errorData.message);
        toast({ title: "Error", description: `Could not fetch users: ${errorData.message || 'Server error'}`, variant: "destructive" });
        setUsers([]);
      }
    } catch (error) {
      console.error("[ManageUsersPage] fetchAllUsersAPI: Network or other error:", error);
      toast({ title: "Error", description: "A network error occurred while fetching users.", variant: "destructive" });
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
      console.log("[ManageUsersPage] fetchAllUsersAPI finished.");
    }
  }, [toast]);

  useEffect(() => {
    if (!authIsLoading && adminUser && adminUser.role === 'admin') {
      fetchAllUsersAPI();
    }
  }, [adminUser, authIsLoading, fetchAllUsersAPI]);
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
  };

  // Placeholder functions for future modal integration that will call API
  const handleAddUser = () => {
    console.log("Add new user clicked - requires modal and API call");
    toast({title: "Feature Coming Soon", description: "Adding users via UI is not yet implemented."});
    // TODO: Implement UserFormModal and POST to /api/users/register (or a dedicated admin create user endpoint)
  };
  const handleEditUser = (userId: string) => {
    console.log("Edit user:", userId, "- requires modal and API call");
    toast({title: "Feature Coming Soon", description: `Editing user ${userId.slice(-4)} via UI is not yet implemented.`});
    // TODO: Implement UserFormModal and PUT to /api/users/[userId]
  };
  
  const handleDeleteUser = async (userId: string) => {
    console.log("Attempting to delete user:", userId);
    // Optimistic UI update can be added here if desired
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (response.ok) {
            toast({ title: "User Deleted", description: `User ${userId.slice(-4)} has been removed.` });
            await fetchAllUsersAPI(); // Refresh list
        } else {
            const errorData = await response.json();
            toast({ title: "Deletion Failed", description: errorData.message || `Could not delete user ${userId.slice(-4)}.`, variant: "destructive"});
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({ title: "Error", description: "An unexpected error occurred during deletion.", variant: "destructive"});
    }
  };

  if (authIsLoading || isLoadingUsers) {
    return <p>Loading users...</p>;
  }
  if (!adminUser || adminUser.role !== 'admin') {
    return <p className="p-4">Access Denied. You must be an admin to view this page.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Manage Users</h1>
          <p className="text-muted-foreground">View and manage all user accounts in the system.</p>
        </div>
        <Button onClick={handleAddUser}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User List ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar"/>
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === 'engineer' && user.engineerLevel && (
                      <Badge variant="secondary" className="capitalize">{user.engineerLevel}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
