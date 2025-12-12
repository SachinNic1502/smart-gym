import type { NextRequest } from "next/server";
import { errorResponse } from "@/lib/api/utils";
import { getRequestIp } from "@/lib/api/auth-helpers";
import { settingsService } from "@/modules/services";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getConfig() {
  const settings = settingsService.getSettings();

  const enabled = settings.apiRateLimitEnabled ?? false;
  const windowSeconds = settings.apiRateLimitWindowSeconds ?? 60;
  const maxRequests = settings.apiRateLimitMaxRequests ?? 60;

  return {
    enabled,
    windowMs: Math.max(1, windowSeconds) * 1000,
    maxRequests: Math.max(1, maxRequests),
  };
}

export function rateLimit(request: NextRequest, key: string): Response | null {
  const { enabled, windowMs, maxRequests } = getConfig();
  if (!enabled) return null;

  const ip = getRequestIp(request) ?? "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();

  const existing = buckets.get(bucketKey);
  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);

  if (existing.count > maxRequests) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  return null;
}
