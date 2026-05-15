import { useState, useEffect, useCallback, useMemo } from "react";
import AdminAccessCheck from "@/components/admin/AdminAccessCheck";
import PageLayout from "@/components/layout/PageLayout";
import { Mail, Send, Users, CheckCircle, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { adminApiCall } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

export default function AdminEmailSubscribers() {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch already registered users from the database
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      try {
        const resData = await adminApiCall("list-all", { page: 1, perPage: 1000 });
        
        if (resData.users) {
          setUsers(
            resData.users.map((user: any) => ({
              id: user.id,
              name: user.full_name || user.user_metadata?.full_name || user.user_metadata?.first_name || user.email.split('@')[0],
              email: user.email,
              isActive: !user.banned_until
            }))
          );
        } else {
          throw new Error(resData.error || "Failed to load users");
        }
      } catch (apiError) {
        console.warn("Edge function failed, falling back to profiles table...", apiError);
        // Fallback: Query profiles table directly
        const { data: profiles, error: profileErr } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .limit(1000);

        if (profileErr) throw profileErr;
        
        if (profiles) {
          setUsers(
            profiles.map((p: any) => ({
              id: p.id,
              name: p.full_name || p.email.split('@')[0],
              email: p.email,
              isActive: true
            }))
          );
        }
      }
    } catch (error: any) {
      console.error("Error fetching registered users:", error);
      toast({
        title: "Error loading users",
        description: error.message || "Could not connect to the database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Handle Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => String(user.id)));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual user selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Check if all current filtered users are selected
  const isAllSelected = filteredUsers.length > 0 && 
    filteredUsers.every(user => selectedUsers.includes(String(user.id)));

  // Send Broadcast Email
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      return toast({
        title: "No Recipients Selected",
        description: "Please select at least one user to send the broadcast to.",
        variant: "destructive"
      });
    }
    
    if (!subject.trim() || !message.trim()) {
      return toast({
        title: "Missing Fields",
        description: "Subject and Message are required.",
        variant: "destructive"
      });
    }

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("token");
      
      // Get the actual email strings of the selected users
      const recipientEmails = users
        .filter(user => selectedUsers.includes(String(user.id)))
        .map(user => user.email);

      // Call the broadcast API endpoint to queue emails
      const isSendingToAll = Boolean(isAllSelected);
      
      const payload: any = {
        subject,
        message,
        targetGroup: isSendingToAll ? "both" : "custom"
      };
      
      // Only include specific emails if not sending to absolutely everyone
      if (!isSendingToAll) {
        payload.emails = recipientEmails;
      }

      const response = await fetch("/api/admin/broadcast-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Broadcast Queued!",
          description: `Successfully queued email to ${data.totalRecipients || recipientEmails.length} recipient(s). They will be delivered shortly.`,
          variant: "default"
        });
        
        // Reset form after successful send
        setSubject("");
        setMessage("");
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error: any) {
      console.error("Error sending broadcast:", error);
      toast({
        title: "Broadcast Failed",
        description: error.message || "There was an error sending the emails.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAccessCheck>
      <PageLayout>
        <div className="flex flex-col space-y-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Email Broadcast</h1>
              <p className="text-muted-foreground mt-2">
                Select registered users and send bulk email updates.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-md">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{users.length} Total Users</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: User Selection Table */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="h-full flex flex-col border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5 text-slate-500" />
                    <span>Registered Users</span>
                  </CardTitle>
                  <CardDescription>
                    Select recipients for your broadcast.
                  </CardDescription>
                  <div className="mt-4 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search names or emails..."
                      className="pl-9 bg-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-0 hover:overflow-y-auto max-h-[500px]">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>No registered users found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center space-x-3 p-4 bg-slate-50 sticky top-0 z-10 border-b">
                        <Checkbox 
                          id="select-all" 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                        <label 
                          htmlFor="select-all" 
                          className="text-sm font-medium cursor-pointer"
                        >
                          Select All ({filteredUsers.length})
                        </label>
                      </div>
                      
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-start space-x-3 p-4 hover:bg-slate-50 transition-colors">
                          <Checkbox 
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(String(user.id))}
                            onCheckedChange={(checked) => handleSelectUser(String(user.id), checked as boolean)}
                            className="mt-1"
                          />
                          <div className="grid gap-1.5 flex-1 cursor-pointer" onClick={() => handleSelectUser(String(user.id), !selectedUsers.includes(String(user.id)))}>
                            <label htmlFor={`user-${user.id}`} className="text-sm font-medium cursor-pointer">
                              {user.name || "Unnamed User"}
                            </label>
                            <p className="text-xs text-slate-500 break-all">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t bg-slate-50 text-sm text-slate-600 flex justify-between">
                  <span>Selected: <strong>{selectedUsers.length}</strong></span>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Email Form */}
            <div className="lg:col-span-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span>Compose Broadcast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendBroadcast} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject Line</label>
                      <Input 
                        placeholder="Important update from the team..." 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex justify-between">
                        <span>Message Body</span>
                      </label>
                      <Textarea 
                        placeholder="Hello, we are writing to inform you..."
                        className="min-h-[300px] resize-y"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Emails will be delivered individually. Your recipients will not see each other in the "To" field.
                      </p>
                    </div>

                    <div className="bg-slate-50 border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${selectedUsers.length > 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {selectedUsers.length > 0 ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedUsers.length === 0 
                              ? "No recipients selected" 
                              : `Ready to send to ${selectedUsers.length} user(s)`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {users.length === 0 ? "Connect to the database to sync users." : "Wait a few seconds after sending for the API to process."}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={sending || selectedUsers.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 px-8"
                      >
                        {sending ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent inline-block rounded-full"></span>
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Send className="mr-2 h-4 w-4" />
                            Send Broadcast
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      </PageLayout>
    </AdminAccessCheck>
  );
}
