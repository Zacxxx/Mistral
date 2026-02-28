"use client"

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getUserAttributes, updateUserAttributes, changePassword, verifyUserAttribute, verifyUserAttributeSubmit } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationAttribute, setVerificationAttribute] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (user) {
        const attrs = await getUserAttributes();
        if (attrs) {
          const attrObj: Record<string, string> = {};
          attrs.forEach(attr => {
            attrObj[attr.Name] = attr.Value;
          });
          setAttributes(attrObj);
        }
      }
    };
    fetchAttributes();
  }, [user]);

  const handleAttributeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateUserAttributes(attributes);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSend = async (attribute: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyUserAttribute(attribute);
      setVerificationAttribute(attribute);
      setIsVerificationSent(true);
      setSuccess(`Verification code sent to ${attribute}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyUserAttributeSubmit(verificationAttribute, verificationCode);
      setSuccess('Attribute verified successfully');
      setIsVerificationSent(false);
      setVerificationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify attribute');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="mb-4 bg-green-50">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <form onSubmit={handleAttributeUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={attributes.name || ''}
                      onChange={(e) => setAttributes({...attributes, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={attributes.email || ''}
                      readOnly
                      disabled
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="security">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Change Password
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="verification">
                {!isVerificationSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Verify Email</Label>
                      <Button
                        variant="outline"
                        onClick={() => handleVerificationSend('email')}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Verification Code
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerificationSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Verification Code</Label>
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Verify {verificationAttribute}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}