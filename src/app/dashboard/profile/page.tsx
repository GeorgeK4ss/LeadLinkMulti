"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  MapPin,
  Globe,
  Briefcase,
  Save,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActivityList } from '@/components/activities/ActivityList';
import { useUserActivities } from '@/hooks/useActivities';
import { ActivityTypes, logUserActivity } from '@/lib/realtime/activities';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  website?: string;
  bio?: string;
  joined?: string;
}

export default function ProfilePage() {
  const { user, tenant } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Get user activities
  const { 
    activities, 
    loading: loadingActivities, 
    error: activitiesError 
  } = useUserActivities(
    tenant?.id,
    user?.uid,
    20
  );

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        // Get additional profile data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          setProfile({
            displayName: user.displayName || userData.displayName || '',
            email: user.email || userData.email || '',
            photoURL: user.photoURL || userData.photoURL,
            phoneNumber: user.phoneNumber || userData.phoneNumber,
            jobTitle: userData.jobTitle,
            company: userData.company,
            location: userData.location,
            website: userData.website,
            bio: userData.bio,
            joined: userData.createdAt 
              ? new Date(userData.createdAt).toLocaleDateString() 
              : new Date().toLocaleDateString(),
          });
        } else {
          // If no document exists, use Firebase Auth data
          setProfile({
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            phoneNumber: user.phoneNumber || undefined,
            joined: new Date().toLocaleDateString(),
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  // Handle profile updates
  const handleSaveProfile = async () => {
    if (!user || !profile || !tenant) return;

    try {
      setSaving(true);
      
      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber,
        jobTitle: profile.jobTitle,
        company: profile.company,
        location: profile.location,
        website: profile.website,
        bio: profile.bio,
        updatedAt: new Date().toISOString(),
      });

      // Log activity
      await logUserActivity(
        tenant.id,
        user.uid,
        user.uid,
        profile.displayName,
        ActivityTypes.USER.UPDATED,
        'updated their profile'
      );

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  // Redirect if not authenticated
  if (!user || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to access your profile.</p>
        <Button onClick={() => router.push('/auth/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            View and manage your personal profile information
          </p>
        </div>

        <Tabs 
          defaultValue="profile" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile card */}
              <Card className="col-span-1">
                <CardHeader className="flex flex-col items-center text-center pb-2">
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24 border-2 border-primary/10">
                      {profile?.photoURL ? (
                        <AvatarImage src={profile.photoURL} alt={profile?.displayName || 'User'} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {profile?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                      onClick={() => toast({
                        title: 'Coming Soon',
                        description: 'Profile photo upload will be available soon',
                      })}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl">
                    {profile?.displayName || 'User'}
                  </CardTitle>
                  <CardDescription>
                    {profile?.jobTitle || 'No job title'} {profile?.company ? `at ${profile.company}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm space-y-2.5">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{profile?.email || 'No email'}</span>
                    </div>
                    {profile?.phoneNumber && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{profile.phoneNumber}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {profile?.joined && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Joined {profile.joined}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'Account settings will be available soon',
                      });
                    }}
                  >
                    Account Settings
                  </Button>
                </CardFooter>
              </Card>

              {/* Edit Profile Form */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl">Edit Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="text-center py-4">Loading profile data...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="displayName"
                              name="displayName"
                              placeholder="Your full name"
                              className="pl-8"
                              value={profile?.displayName || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              name="email"
                              placeholder="Your email address"
                              className="pl-8"
                              value={profile?.email || ''}
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phoneNumber"
                              name="phoneNumber"
                              placeholder="Your phone number"
                              className="pl-8"
                              value={profile?.phoneNumber || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="location"
                              name="location"
                              placeholder="City, Country"
                              className="pl-8"
                              value={profile?.location || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <div className="relative">
                            <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="jobTitle"
                              name="jobTitle"
                              placeholder="Your job title"
                              className="pl-8"
                              value={profile?.jobTitle || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <div className="relative">
                            <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="company"
                              name="company"
                              placeholder="Your company name"
                              className="pl-8"
                              value={profile?.company || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="website"
                            name="website"
                            placeholder="https://yourwebsite.com"
                            className="pl-8"
                            value={profile?.website || ''}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input
                          id="bio"
                          name="bio"
                          placeholder="A short bio about yourself"
                          value={profile?.bio || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Reset form
                      if (window.confirm('Are you sure you want to discard your changes?')) {
                        router.refresh();
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving || loading}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                    {!saving && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
                <CardDescription>
                  Recent actions and changes you've made in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityList 
                  activities={activities}
                  loading={loadingActivities}
                  error={activitiesError}
                  emptyMessage="You don't have any activities yet"
                  maxHeight="500px"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 