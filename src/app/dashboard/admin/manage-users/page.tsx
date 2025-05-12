
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
// import { mockUsers } from '@/lib/mock-data'; // Removed mock data
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
import { getAllUsers, deleteUser as deleteUserService } from '@/services/userService'; // Import Firestore service
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ManageUsersPage() {
  const { user: adminUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchUsersData = async () => {
    setIsLoadingUsers(true);
    const usersData = await getAllUsers();
    setUsers(usersData);
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    if (!authLoading && adminUser && adminUser.role === 'admin') {
      fetchUsersData();
    }
  }, [adminUser, authLoading]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Prevent admin from deleting themselves
    if (adminUser && userId === adminUser.id) {
      toast({
        title: "Action Denied",
        description: "Administrators cannot delete their own account.",
        variant: "destructive",
      });
      return;
    }

    const originalUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== userId));

    const success = await deleteUserService(userId);
    if (!success) {
      setUsers(originalUsers);
      toast({
        title: "Deletion Failed",
        description: `Could not delete user ${userName}. Their Firebase Auth account may still exist.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "User Deleted",
        description: `User ${userName} has been removed from Firestore. Their Firebase Auth account may need separate deletion if required.`,
      });
    }
  };


  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
  };

  if (authLoading || (isLoadingUsers && adminUser)) {
    return <div className="flex items-center justify-center h-screen"><p>Loading user data...</p></div>;
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
        <Button disabled> {/* Add user functionality would typically go to a new page/modal for creating Firebase Auth user + Firestore record */}
          <UserPlus className="mr-2 h-4 w-4" /> Add New User (Disabled)
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User List ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? <p>Loading users...</p> : (
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
                      <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="user avatar" />
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
                        <DropdownMenuItem disabled> {/* Edit user needs a form/modal and userService.updateUser call */}
                          <Edit className="mr-2 h-4 w-4" /> Edit User (Disabled)
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={adminUser?.id === user.id} // Disable deleting self
                              >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account
                                 "{user.name}" from Firestore. Their Firebase Auth account will NOT be automatically deleted by this action.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
