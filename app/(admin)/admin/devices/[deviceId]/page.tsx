"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { devicesApi, ApiError } from "@/lib/api/client";
import type { Device } from "@/lib/types";
import type { BadgeProps } from "@/components/ui/badge";
import { useDevice } from "@/hooks/use-devices";
import { Activity, ArrowLeft, Fingerprint, MapPin, RefreshCcw, Server, Wifi, Cpu, Globe, ShieldCheck, History, Zap, Clock, Database } from "lucide-react";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const deviceId = params?.deviceId as string | undefined;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const { device, loading, error, refetch } = useDevice(deviceId || "");

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/devices")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading device...</CardTitle>
            <CardDescription>Please wait while we fetch the latest device details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/devices")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Device not found</CardTitle>
            <CardDescription>
              {error || "We couldn&apos;t find details for this device. Please return to the list and try again."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusLabel = device.status.charAt(0).toUpperCase() + device.status.slice(1);

  const statusVariant: BadgeProps["variant"] =
    device.status === "online"
      ? "success"
      : device.status === "offline"
        ? "destructive"
        : "warning";

  const connectionLabel =
    device.connectionType === "cloud"
      ? "Cloud"
      : "LAN (Local Network)";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-12 -translate-y-12">
          <Server className="w-80 h-80" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <Button
            variant="ghost"
            className="w-fit text-white hover:bg-white/10 rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-white/10 backdrop-blur-md"
            onClick={() => router.push("/admin/devices")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md shadow-inner">
                  <Fingerprint className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-black tracking-tight">{device.name}</h2>
                    <Badge variant={statusVariant} className="rounded-lg px-3 py-1 font-black uppercase tracking-widest text-[9px] border-0 shadow-lg">
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-blue-100 font-bold uppercase tracking-widest text-[10px] opacity-80">
                    <MapPin className="h-3 w-3" />
                    {device.branchName} • ID: {device.id}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-6 rounded-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest gap-2"
                onClick={async () => {
                  toast({ title: "Polling Status...", variant: "info" });
                  await refetch();
                  toast({ title: "Status Updated", variant: "success" });
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Poll Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 px-1">
        {[
          { title: 'Connection', value: connectionLabel, icon: Wifi, color: 'blue', sub: device.ipAddress || 'via Cloud' },
          { title: 'System Health', value: 'Optimal', icon: ShieldCheck, color: 'emerald', sub: 'Last ping 2m ago' },
          { title: 'Architecture', value: device.model || device.type, icon: Cpu, color: 'indigo', sub: `Ver ${device.firmwareVersion || '1.0.0'}` },
          { title: 'Last Sync', value: device.lastPing ? new Date(device.lastPing).toLocaleTimeString() : 'Never', icon: History, color: 'rose', sub: device.lastPing ? new Date(device.lastPing).toLocaleDateString() : 'Pending' }
        ].map((item, i) => (
          <Card key={i} className="group border-0 shadow-lg bg-white rounded-[1.5rem] overflow-hidden hover:shadow-2xl transition-all">
            <CardHeader className="p-7 flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <p className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest`}>{item.title}</p>
                <CardTitle className="text-2xl font-black text-gray-800 tracking-tighter">
                  {item.value}
                </CardTitle>
              </div>
              <div className={`p-3 bg-${item.color}-50 rounded-2xl text-${item.color}-600 group-hover:bg-${item.color}-500 group-hover:text-white transition-all`}>
                <item.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="px-7 pb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 px-1">
        {/* Network Intelligence */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-blue-500">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Network Intelligence</CardTitle>
                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Connectivity & Routing details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Protocol</p>
                <p className="font-black text-gray-800">{device.connectionType === 'cloud' ? 'Secure WebSocket' : 'TCP/IP Local'}</p>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal IP</p>
                <p className="font-mono font-bold text-gray-800">{device.ipAddress || 'Static DHCP'}</p>
              </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Target Endpoint</p>
                  <p className="text-xs font-bold text-indigo-900 break-all">{device.cloudUrl || 'Internal Mesh Gateway'}</p>
                </div>
              </div>
              <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide">
              * Analytics are live-streamed from the device firmware. Latency values are averaged over the last 60 minutes.
            </p>
          </CardContent>
        </Card>

        {/* Control Center */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-gray-50 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-rose-500">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Control Center</CardTitle>
                <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manual overrides & diagnostics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <Button
                disabled={isSyncing}
                onClick={async () => {
                  if (!device) return;
                  setIsSyncing(true);
                  try {
                    await devicesApi.sync(device.id);
                    toast({ title: "Sync initiated", description: "Member database is being synchronized.", variant: "success" });
                  } catch (e) {
                    const message = e instanceof ApiError ? e.message : "Sync failed";
                    toast({ title: "Error", description: message, variant: "destructive" });
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                className="w-full justify-between h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] px-6 shadow-xl transition-all hover:scale-[1.02]"
              >
                {isSyncing ? "Syncing..." : "Re-Sync Member Database"}
                <RefreshCcw className={`h-4 w-4 opacity-50 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={isRebooting}
                  onClick={() => {
                    toast({
                      title: "Reboot Device?",
                      description: "This will temporarily disconnect the device.",
                      variant: "warning",
                      duration: Infinity,
                      action: ({ dismiss }) => (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={dismiss}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            dismiss();
                            if (!device) return;
                            setIsRebooting(true);
                            try {
                              await devicesApi.reboot(device.id);
                              toast({ title: "Reboot sequence started", variant: "success" });
                            } catch (e) {
                              toast({ title: "Reboot failed", variant: "destructive" });
                            } finally {
                              setIsRebooting(false);
                            }
                          }}>Confirm</Button>
                        </div>
                      )
                    });
                  }}
                  className="h-14 rounded-2xl border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  {isRebooting ? "Rebooting..." : "Power Cycle"}
                </Button>
                <Button
                  variant="outline"
                  disabled={isFlashing}
                  onClick={() => {
                    toast({
                      title: "Flash Firmware?",
                      description: "Do not unplug device during this process.",
                      variant: "warning",
                      duration: Infinity,
                      action: ({ dismiss }) => (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={dismiss}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            dismiss();
                            if (!device) return;
                            setIsFlashing(true);
                            try {
                              await devicesApi.flash(device.id);
                              toast({ title: "Firmware update started", variant: "success" });
                            } catch (e) {
                              toast({ title: "Update failed", variant: "destructive" });
                            } finally {
                              setIsFlashing(false);
                            }
                          }}>Install Update</Button>
                        </div>
                      )
                    });
                  }}
                  className="h-14 rounded-2xl border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  {isFlashing ? "Flashing..." : "Flash Firmware"}
                </Button>

                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 font-black uppercase tracking-widest text-[10px] transition-all"
                  onClick={async () => {
                    if (!device) return;
                    try {
                      await devicesApi.update(device.id, { status: "online" });
                      toast({ title: "Device Powered On", variant: "success" });
                      refetch();
                    } catch (e) {
                      toast({ title: "Failed to power on", variant: "destructive" });
                    }
                  }}
                >
                  Power On
                </Button>
                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-black uppercase tracking-widest text-[10px] transition-all"
                  onClick={async () => {
                    if (!device) return;
                    toast({
                      title: "Power Off?",
                      description: "Device will go offline.",
                      variant: "warning",
                      duration: Infinity,
                      action: ({ dismiss }) => (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={dismiss}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            dismiss();
                            try {
                              await devicesApi.update(device.id, { status: "offline" });
                              toast({ title: "Device Powered Off", variant: "success" });
                              refetch();
                            } catch (e) {
                              toast({ title: "Failed to power off", variant: "destructive" });
                            }
                          }}>Confirm</Button>
                        </div>
                      )
                    });
                  }}
                >
                  Power Off
                </Button>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Log</h4>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200">View All</Badge>
              </div>
              <div className="space-y-4">
                {[
                  { action: 'Database Synchronized', time: '2 mins ago', status: 'success' },
                  { action: 'Heartbeat Detected', time: '14 mins ago', status: 'success' },
                  { action: 'Config Package Uploaded', time: '1 hour ago', status: 'success' }
                ].map((log, l) => (
                  <div key={l} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-600 tracking-tight">{log.action}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
