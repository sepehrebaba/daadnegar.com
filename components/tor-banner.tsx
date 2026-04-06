"use client";

import { useEffect, useState } from "react";
import { Shield, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOR_BANNER_DISMISSED_KEY = "daadnegar_tor_banner_dismissed";
const ONION_ADDRESS = "daadnevjdvcv2ix5hhe6iklzzviie53kccu66ctp7wml6vpvw52mwvqd.onion";

export function TorBanner() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isOnOnion = window.location.hostname.endsWith(".onion");
    const dismissed = localStorage.getItem(TOR_BANNER_DISMISSED_KEY) === "1";
    if (!isOnOnion && !dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(TOR_BANNER_DISMISSED_KEY, "1");
    setShow(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`http://${ONION_ADDRESS}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select and copy
      const input = document.createElement("input");
      input.value = `http://${ONION_ADDRESS}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!show) return null;

  return (
    <div
      role="banner"
      className="bg-primary/10 text-foreground border-primary/20 flex flex-wrap items-center justify-center gap-3 border-b px-4 py-2.5 text-sm"
    >
      <Shield className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 text-center">
        برای حریم خصوصی و امنیت بیشتر، از مرورگر تور با آدرس زیر استفاده کنید:
      </span>
      <code className="bg-background/80 rounded px-2 py-1 text-xs">{ONION_ADDRESS}</code>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={handleCopy}
        aria-label="کپی آدرس"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "کپی شد" : "کپی"}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={handleDismiss}
        aria-label="بستن"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
