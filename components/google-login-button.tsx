import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoogleLoginButton({ disabled }: { disabled?: boolean }) {
  if (disabled) {
    return (
      <span className={cn(buttonVariants({ size: "lg" }), "pointer-events-none opacity-50")}>
        Continue with Google
      </span>
    );
  }

  return (
    <Link href="/api/auth/google" className={cn(buttonVariants({ size: "lg" }))}>
      Continue with Google
    </Link>
  );
}
