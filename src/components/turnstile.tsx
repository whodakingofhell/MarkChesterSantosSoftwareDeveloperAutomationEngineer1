"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ siteKey, onVerify, onExpire }: TurnstileWidgetProps) {
  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{
        theme: "light",
        size: "normal",
        appearance: "interaction-only",
      }}
    />
  );
}
