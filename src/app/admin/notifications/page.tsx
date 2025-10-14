
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Lock } from "lucide-react";
import {
  addNotification,
  getNotifications,
  subscribeToNotifications,
  initializeNotifications,
  getBranches,
  subscribeToBranches,
  initializeBranches
} from "@/lib/data-store";
import type { DomainNotification } from "@/lib/data-store";
import type { Branch } from "../branches/branch-types";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertTitle } from "@/components/ui/alert";

const ALL_STAFF_VALUE = "all-staff-target";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title is too long."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message is too long."),
  target_branch_id: z.string().min(1, "You must select a target."),
});

type NotificationFormValues = z.infer<typeof formSchema>;

interface UserProfile {
  name?: string;
  role?: string;
  branchId?: string;
}

export default function AdminNotificationsPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [sentNotifications, setSentNotifications] = React.useState<DomainNotification[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    Promise.all([initializeNotifications(), initializeBranches()]).then(() => {
      setSentNotifications(getNotifications());
      setBranches(getBranches());
      setIsLoading(false);
    });

    const unsubNotifications = subscribeToNotifications(setSentNotifications);
    const unsubBranches = subscribeToBranches(setBranches);
    
    return () => {
      unsubNotifications();
      unsubBranches();
    };
  }, []);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      target_branch_id: user?.role?.toLowerCase() === 'staff management' ? user.branchId : ALL_STAFF_VALUE,
    },
  });

  const filteredAndSortedNotifications = React.useMemo(() => {
    let notificationsToDisplay = [...sentNotifications];
    const userRole = user?.role?.toLowerCase();
    const isPrivilegedUser = userRole === 'admin' || userRole === 'head office management';

    if (!isPrivilegedUser && user?.branchId) {
      notificationsToDisplay = sentNotifications.filter(n =>
        n.targetBranchId === null || n.targetBranchId === user.branchId
      );
    }
    
    return notificationsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sentNotifications, user]);


  async function onSubmit(data: NotificationFormValues) {
    if (!user?.name) {
      toast({ variant: "destructive", title: "Error", description: "Could not find sender name. Please log in again." });
      return;
    }
    
    const targetBranchId = data.target_branch_id === ALL_STAFF_VALUE ? null : data.target_branch_id;

    const result = await addNotification({
      title: data.title,
      message: data.message,
      targetBranchId: targetBranchId, 
      senderName: user.name,
    });

    if (result.success) {
      const displayTargetName = targetBranchId === null
          ? "All Staff"
          : branches.find(b => b.id === targetBranchId)?.name || "the selected branch";
      toast({ title: "Notification Sent", description: `Your message has been sent to ${displayTargetName}.` });
      form.reset({
        title: "",
        message: "",
        target_branch_id: user?.role?.toLowerCase() === 'staff management' ? user.branchId : ALL_STAFF_VALUE,
      });
    } else {
      toast({ variant: "destructive", title: "Failed to Send", description: result.message });
    }
  }

  const getDisplayTargetName = (targetId: string | null) => {
    if (targetId === null) return "All Staff";
    return branches.find(b => b.id === targetId)?.name || `ID: ${targetId}`;
  };
  
  const canCreateNotifications = hasPermission('notifications_create');
  const canViewNotifications = hasPermission('notifications_view');
  const isBranchManager = user?.role?.toLowerCase() === 'staff management' && user.branchId;

  if (!canViewNotifications) {
      return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
            <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <CardDescription>You do not have permission to view this page.</CardDescription>
            </Alert>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Send Notifications</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {canCreateNotifications && (
            <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>Send a message to all staff or a specific branch.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., System Maintenance" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Enter your notification message here..." {...field} rows={6} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="target_branch_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Send To</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {!isBranchManager && <SelectItem value={ALL_STAFF_VALUE}>All Staff</SelectItem>}
                              {branches
                                .filter(branch => !isBranchManager || branch.id === user.branchId)
                                .map(branch => (
                                  branch?.id ? (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                  ) : null
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? "Sending..." : "Send Notification"}
                    </Button>
                </form>
                </Form>
            </CardContent>
            </Card>
        )}

        <Card className={`shadow-lg ${canCreateNotifications ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
          <CardHeader>
            <CardTitle>Sent History</CardTitle>
            <CardDescription>A log of previously sent notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Message</TableHead>
                            <TableHead>Target</TableHead>
                            <TableHead>Sent</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading notifications...</TableCell></TableRow>
                        ) : filteredAndSortedNotifications.length > 0 ? (
                            filteredAndSortedNotifications.map(n => (
                            <TableRow key={n.id}>
                                <TableCell>
                                <p className="font-medium">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{n.message}</p>
                                </TableCell>
                                <TableCell>{getDisplayTargetName(n.targetBranchId)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">No notifications sent yet.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
