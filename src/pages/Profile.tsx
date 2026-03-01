import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, Camera, Save, Edit3 } from 'lucide-react';
import { toast } from "sonner";
import PageLayout from '@/components/layout/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Profile form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      // Initialize form with existing user data
      const fullName = user.user_metadata?.name || '';
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setPhoneNumber(user.user_metadata?.phone || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      
      checkAdminRole(user.id);
    }
  }, [user]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: `${firstName} ${lastName}`.trim(),
          phone: phoneNumber,
          avatar_url: avatarUrl || undefined
        }
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original values
    if (user) {
      const fullName = user.user_metadata?.name || '';
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setPhoneNumber(user.user_metadata?.phone || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const initials = userName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  if (!user) {
    return (
      <PageLayout title="Profile" subtitle="User profile not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Profile" 
      subtitle="Manage your personal information and account settings"
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto px-2 sm:px-0">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User size={16} />
              <span>Personal Info</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Mail size={16} />
              <span>Account Details</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and profile picture
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCancelEdit} 
                        variant="outline" 
                        size="sm"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveProfile} 
                        size="sm"
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} />
                    ) : (
                      <AvatarFallback className={`text-lg ${isAdmin ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {userName}
                      {isAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </h3>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-1" />
                          Upload Photo
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAvatarUrl('')}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user.email || ''}
                      disabled={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Details
                </CardTitle>
                <CardDescription>
                  View your account information and security details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">User ID</Label>
                      <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1">
                        {user.id}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Email Verification</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {user.email_confirmed_at ? (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Verified
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Account Role</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {isAdmin ? (
                          <Badge variant="destructive">
                            <Shield className="h-3 w-3 mr-1" />
                            Administrator
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            User
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Account Created</Label>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(user.created_at)}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Last Sign In</Label>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Authentication Provider</Label>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {user.app_metadata?.provider || 'Email'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Security & Privacy</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your account security and privacy settings.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                    <Button variant="outline" size="sm">
                      Two-Factor Auth
                    </Button>
                    <Button variant="outline" size="sm">
                      Privacy Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}