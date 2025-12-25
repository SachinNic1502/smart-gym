"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Lock, Bell, Palette, Settings, ShieldCheck, Cpu, UploadCloud, Save, RefreshCw, Smartphone, Key, Terminal, Code2, Clock, Calendar, Mail, MessageSquare, AlertTriangle, CreditCard, Send, Server, Zap } from "lucide-react";
import { settingsApi, ApiError } from "@/lib/api/client";
import type { SystemSettings } from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";

import { useSettings } from "@/lib/hooks/use-settings";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSettings } = useSettings();

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
      await refreshSettings();
      toast({ title: "Settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        maintenanceMode: settings.maintenanceMode,
      });
      await refreshSettings();
      toast({ title: "Preferences updated", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update preferences";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
      });
      await refreshSettings();
      toast({ title: "Notification settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save notifications";
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
      await refreshSettings();
      toast({ title: "Branding updated", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update branding";
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
        apiRateLimitEnabled: settings.apiRateLimitEnabled,
        apiRateLimitWindowSeconds: settings.apiRateLimitWindowSeconds,
        apiRateLimitMaxRequests: settings.apiRateLimitMaxRequests,
      });
      await refreshSettings();
      toast({ title: "Security settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save security settings";
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
        paymentGatewayProvider: settings.paymentGatewayProvider,
        paymentGatewayKey: settings.paymentGatewayKey,
        paymentGatewaySecret: settings.paymentGatewaySecret,
        whatsappProvider: settings.whatsappProvider,
        whatsappApiKey: settings.whatsappApiKey,
        whatsappPhoneNumber: settings.whatsappPhoneNumber,
        messagingProvider: settings.messagingProvider,
        messagingApiKey: settings.messagingApiKey,
        messagingSenderId: settings.messagingSenderId,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
        smtpSecure: settings.smtpSecure,
      });
      await refreshSettings();
      toast({ title: "API settings saved", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save API settings";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-8 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-[2rem] w-full" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl w-32" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl w-full" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="max-w-4xl p-12 text-center space-y-4">
        <div className="inline-flex p-6 bg-rose-50 text-rose-600 rounded-full">
          <ShieldCheck className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Oops! Something went wrong</h2>
        <p className="text-slate-500 font-medium">{error || "The system settings are currently unreachable."}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl px-8 h-12 font-bold">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
          <Settings className="w-80 h-80" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Cpu className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Settings</h2>
            </div>
            <p className="text-slate-300 text-xl font-light max-w-2xl leading-relaxed">
              Manage global settings, security, and branding for the entire platform.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Settings Active</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="px-1">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto mb-8 flex flex-wrap gap-1 lg:w-fit">
          <TabsTrigger value="general" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            General
          </TabsTrigger>
          <TabsTrigger value="preferences" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="branding" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 transition-all">
            API & Webhooks
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-0 space-y-6">
          <Card className="border-0 shadow-2xl shadow-slate-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-blue-600">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">General Settings</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Basic platform details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Site Name</Label>
                  <Input className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-blue-500 font-bold" value={settings.siteName ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, siteName: e.target.value } : null)} />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Support Email</Label>
                  <Input className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-blue-500 font-bold" value={settings.supportEmail ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, supportEmail: e.target.value } : null)} />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Default Currency</Label>
                  <Select
                    value={settings.currency ?? ""}
                    onValueChange={(val) => setSettings(prev => prev ? { ...prev, currency: val } : null)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-blue-500 font-bold">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-1 leading-relaxed">Used for all system payments</p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <Button className="h-12 rounded-[1.2rem] bg-slate-900 hover:bg-black font-black px-10 shadow-xl shadow-slate-200 gap-2" onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="mt-0 space-y-6">
          <Card className="border-0 shadow-2xl shadow-slate-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Preferences</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Localization and system-wide behavior</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Timezone</Label>
                  <Select
                    value={settings.timezone ?? ""}
                    onValueChange={(val) => setSettings(prev => prev ? { ...prev, timezone: val } : null)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-amber-500 font-bold">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC (Universal)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Date Format</Label>
                  <Select
                    value={settings.dateFormat ?? ""}
                    onValueChange={(val) => setSettings(prev => prev ? { ...prev, dateFormat: val } : null)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-amber-500 font-bold">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Maintenance Mode</h4>
                    </div>
                    <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest leading-relaxed max-w-md">
                      When enabled, members will not be able to access the portal. Only super admins can log in.
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode ?? false}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, maintenanceMode: checked } : null)}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <Button className="h-12 rounded-[1.2rem] bg-amber-600 hover:bg-amber-700 text-white font-black px-10 shadow-xl shadow-amber-100 gap-2" onClick={handleSavePreferences} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="mt-0">
          <Card className="border-0 shadow-2xl shadow-slate-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-100 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-purple-600">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Look & Feel</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Customize the appearance of the platform</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="h-20 w-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-2xl">SF</div>
                <div>
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Logo</h4>
                  <p className="text-xs font-medium text-gray-400 mt-1 max-w-sm">Upload a high-resolution logo (SVG or PNG). Recommended size: 512x512.</p>
                  <Button variant="outline" className="mt-4 rounded-xl border-slate-300 font-bold text-[10px] uppercase tracking-widest gap-2">
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload Image
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Primary Color</Label>
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-2xl border-4 border-white shadow-xl flex-shrink-0" style={{ backgroundColor: settings.primaryColor }}></div>
                    <Input className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-purple-500 font-mono font-bold" value={settings.primaryColor ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, primaryColor: e.target.value } : null)} />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Secondary Color</Label>
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-2xl border-4 border-white shadow-xl flex-shrink-0" style={{ backgroundColor: settings.secondaryColor }}></div>
                    <Input className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-purple-500 font-mono font-bold" value={settings.secondaryColor ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)} />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <Button className="h-12 rounded-[1.2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 shadow-xl shadow-indigo-100 gap-2" onClick={handleSaveBranding} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Branding"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-0">
          <Card className="border-0 shadow-2xl shadow-rose-50 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-100 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-rose-600">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Security</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage security policies and login rules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Min Password Length</Label>
                  <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-rose-500 font-bold" min={6} max={32} value={settings.minPasswordLength ?? 8} onChange={(e) => setSettings(prev => prev ? { ...prev, minPasswordLength: Number(e.target.value) } : null)} />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Session Timeout (Minutes)</Label>
                  <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-rose-500 font-bold" min={5} max={240} value={settings.sessionTimeoutMinutes ?? 30} onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeoutMinutes: Number(e.target.value) } : null)} />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-xs font-black uppercase text-gray-400 ml-1">Allowed IP Range</Label>
                  <div className="relative">
                    <Terminal className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input placeholder="e.g. 192.168.1.0/24" className="h-12 rounded-2xl bg-slate-50 border-0 focus:ring-2 focus:ring-rose-500 font-mono font-bold pl-12" value={settings.allowedIpRange ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, allowedIpRange: e.target.value } : null)} />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 ml-1">Caution: Restricting IP ranges may block remote access.</p>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-6 shadow-2xl mt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <h4 className="text-lg font-black tracking-tight uppercase">API Rate Limiting</h4>
                    </div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">Prevent brute-force and DDoS by limiting requests per IP</p>
                  </div>
                  <Switch
                    checked={settings.apiRateLimitEnabled ?? false}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, apiRateLimitEnabled: checked } : null)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Time Window (Seconds)</Label>
                    <Input
                      type="number"
                      className="h-12 bg-white/10 border-0 rounded-xl px-5 font-bold focus:ring-2 focus:ring-rose-500 text-white"
                      value={settings.apiRateLimitWindowSeconds ?? 60}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, apiRateLimitWindowSeconds: Number(e.target.value) } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Max Requests</Label>
                    <Input
                      type="number"
                      className="h-12 bg-white/10 border-0 rounded-xl px-5 font-bold focus:ring-2 focus:ring-rose-500 text-white"
                      value={settings.apiRateLimitMaxRequests ?? 60}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, apiRateLimitMaxRequests: Number(e.target.value) } : null)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <Button className="h-12 rounded-[1.2rem] bg-rose-600 hover:bg-rose-700 text-white font-black px-10 shadow-xl shadow-rose-100 gap-2" onClick={handleSaveSecurity} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Security"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0 space-y-6">
          <Card className="border-0 shadow-2xl shadow-blue-50 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-blue-600">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Notifications</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure global communication channels</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Email Notifications</h4>
                      <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">System alerts and member updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications ?? false}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, emailNotifications: checked } : null)}
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-emerald-500">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">SMS Notifications</h4>
                      <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">Direct mobile messages for alerts</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications ?? false}
                    onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, smsNotifications: checked } : null)}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <Button className="h-12 rounded-[1.2rem] bg-blue-600 hover:bg-blue-700 text-white font-black px-10 shadow-xl shadow-blue-100 gap-2" onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Notifications"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-0">
          <Card className="border-0 shadow-2xl shadow-indigo-50 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-100 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-indigo-600">
                  <Code2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Integrations & API</CardTitle>
                  <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage external services and API keys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Payment Gateway */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Payment Gateway</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Provider</Label>
                      <Select value={settings.paymentGatewayProvider ?? "none"} onValueChange={(val: any) => setSettings(prev => prev ? { ...prev, paymentGatewayProvider: val } : null)}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Disabled</SelectItem>
                          <SelectItem value="razorpay">Razorpay</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Key / Publishable Key</Label>
                      <Input value={settings.paymentGatewayKey ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, paymentGatewayKey: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Secret / Secret Key</Label>
                      <Input type="password" value={settings.paymentGatewaySecret ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, paymentGatewaySecret: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-mono text-xs" />
                    </div>
                  </div>
                </div>

                {/* WhatsApp API */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">WhatsApp Business</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Provider</Label>
                      <Select value={settings.whatsappProvider ?? "none"} onValueChange={(val: any) => setSettings(prev => prev ? { ...prev, whatsappProvider: val } : null)}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Disabled</SelectItem>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="meta">Meta Graph API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Access Token</Label>
                      <Input value={settings.whatsappApiKey ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, whatsappApiKey: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Business Phone Number</Label>
                      <Input value={settings.whatsappPhoneNumber ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, whatsappPhoneNumber: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs" />
                    </div>
                  </div>
                </div>

                {/* Messaging API */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <Send className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">SMS Gateway</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Provider</Label>
                      <Select value={settings.messagingProvider ?? "none"} onValueChange={(val: any) => setSettings(prev => prev ? { ...prev, messagingProvider: val } : null)}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Disabled</SelectItem>
                          <SelectItem value="twilio">Twilio SMS</SelectItem>
                          <SelectItem value="msg91">MSG91</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Key</Label>
                      <Input value={settings.messagingApiKey ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, messagingApiKey: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Sender ID / From Number</Label>
                      <Input value={settings.messagingSenderId ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, messagingSenderId: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs" />
                    </div>
                  </div>
                </div>

                {/* SMTP Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Server className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Email (SMTP)</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Host</Label>
                        <Input value={settings.smtpHost ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, smtpHost: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Port</Label>
                        <Input type="number" value={settings.smtpPort ?? 587} onChange={(e) => setSettings(prev => prev ? { ...prev, smtpPort: Number(e.target.value) } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Username</Label>
                      <Input value={settings.smtpUser ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, smtpUser: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-medium text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</Label>
                      <Input type="password" value={settings.smtpPass ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, smtpPass: e.target.value } : null)} className="h-11 rounded-xl bg-slate-50 border-0 font-mono text-xs" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <Label className="text-xs font-bold uppercase tracking-tight">SSL / Secure</Label>
                      <Switch checked={settings.smtpSecure ?? false} onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, smtpSecure: checked } : null)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tight">Webhook Configuration</h4>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">System-wide events callback URL</p>
                  <div className="mt-4 max-w-md">
                    <Input placeholder="https://api.yourdomain.com/webhooks" value={settings.webhookUrl ?? ""} onChange={(e) => setSettings(prev => prev ? { ...prev, webhookUrl: e.target.value } : null)} className="h-12 rounded-[1.2rem] bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 font-bold" />
                  </div>
                </div>
                <Button className="h-12 rounded-[1.2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 shadow-xl shadow-indigo-100 gap-2" onClick={handleSaveApi} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving Integrations..." : "Save API Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
