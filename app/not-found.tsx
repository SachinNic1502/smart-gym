import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
            <Ghost className="h-8 w-8" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you are looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, please contact your gym administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
