"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Bell, Palette } from "lucide-react";
import { settingsApi, ApiError } from "@/lib/api/client";
import type { SystemSettings } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await settingsApi.get();
        setSettings(data);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to load settings";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        siteName: settings.siteName,
        supportEmail: settings.supportEmail,
        currency: settings.currency,
      });
      toast({ title: "General settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });
      toast({ title: "Branding settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        minPasswordLength: settings.minPasswordLength,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        allowedIpRange: settings.allowedIpRange,
      });
      toast({ title: "Security settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApi = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        publicApiBaseUrl: settings.publicApiBaseUrl,
        webhookUrl: settings.webhookUrl,
        apiRateLimitEnabled: settings.apiRateLimitEnabled,
        apiRateLimitWindowSeconds: settings.apiRateLimitWindowSeconds,
        apiRateLimitMaxRequests: settings.apiRateLimitMaxRequests,
      });
      toast({ title: "API settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-red-500">{error ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">Global configuration for your SaaS.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Identity</CardTitle>
              <CardDescription>Basic details about your SaaS application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>SaaS Name</Label>
                <Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Support Email</Label>
                <Input value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Default Currency</Label>
                <Input value={`${settings.currency} (${settings.currency === "INR" ? "₹" : "$"})`} disabled />
              </div>
              <Button className="mt-4" onClick={handleSaveGeneral} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Look & Feel</CardTitle>
              <CardDescription>Customize the appearance for your tenants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold">SF</div>
                <Button variant="outline">Upload Logo</Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <div className="h-10 w-10 rounded-md border border-gray-200" style={{ backgroundColor: settings.primaryColor }}></div>
                    <Input value={settings.primaryColor ?? ""} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <div className="h-10 w-10 rounded-md border border-gray-200" style={{ backgroundColor: settings.secondaryColor }}></div>
                    <Input value={settings.secondaryColor ?? ""} onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })} />
                  </div>
                </div>
              </div>
              <Button className="mt-4" onClick={handleSaveBranding} disabled={saving}>
                {saving ? "Saving..." : "Save Branding"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Define global security rules for all admins and staff logins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Minimum Password Length</Label>
                <Input type="number" min={6} max={32} value={settings.minPasswordLength ?? 8} onChange={(e) => setSettings({ ...settings, minPasswordLength: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Session Timeout (minutes)</Label>
                <Input type="number" min={5} max={240} value={settings.sessionTimeoutMinutes ?? 30} onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Allowed Login IP Range (optional)</Label>
                <Input placeholder="e.g. 0.0.0.0/0 or 10.0.0.0/24" value={settings.allowedIpRange ?? ""} onChange={(e) => setSettings({ ...settings, allowedIpRange: e.target.value })} />
              </div>
              <Button className="mt-4" onClick={handleSaveSecurity} disabled={saving}>
                {saving ? "Saving..." : "Save Security Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API & Webhooks</CardTitle>
              <CardDescription>Manage API keys for integrations and webhook callbacks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Public API Base URL</Label>
                <Input value={settings.publicApiBaseUrl ?? ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Admin API Key</Label>
                <div className="flex gap-2">
                  <Input type="password" value="••••••••••••" disabled className="flex-1" />
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Webhook URL</Label>
                <Input placeholder="https://your-server.com/webhooks/smartfit" value={settings.webhookUrl ?? ""} onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })} />
              </div>

              <div className="mt-6 border-t pt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">Protect APIs from abuse by limiting requests per IP.</p>
                </div>

                <div className="grid gap-2">
                  <Label>Enable Rate Limiting (0 = disabled)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.apiRateLimitEnabled ? 1 : 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiRateLimitEnabled: Number(e.target.value) > 0,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Window (seconds)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.apiRateLimitWindowSeconds ?? 60}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          apiRateLimitWindowSeconds: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Requests / Window</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.apiRateLimitMaxRequests ?? 60}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          apiRateLimitMaxRequests: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button className="mt-4" onClick={handleSaveApi} disabled={saving}>
                {saving ? "Saving..." : "Save API Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
