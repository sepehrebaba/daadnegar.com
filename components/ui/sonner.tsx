"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
        },
      }}
      className="toaster group"
      style={
        {
          "--normal-bg": "#1a1a1a",
          "--normal-text": "#fff",
          "--normal-border": "transparent",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
