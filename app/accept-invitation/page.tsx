"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy accept-invitation page - redirects to home. Use /register?code=X instead. */
export default function AcceptInvitationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="text-center">در حال انتقال...</div>
    </div>
  );
}
