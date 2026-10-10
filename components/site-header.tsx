"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#location", label: "Location" },
  { href: "/finances", label: "Finances" },
];

export function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4 lg:px-6">
        <Link href="/" className="font-heading text-base font-semibold tracking-tight">
          Ledger
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link
            href={isLoggedIn ? "/profile" : "/login"}
            className={cn(
              buttonVariants({ variant: isLoggedIn ? "outline" : "default" }),
              "hidden md:inline-flex"
            )}
          >
            {isLoggedIn ? "Profile" : "Log in"}
          </Link>

          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "md:hidden"
              )}
              aria-label="Open menu"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Ledger</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={isLoggedIn ? "/profile" : "/login"}
                  className={cn(buttonVariants(), "justify-start")}
                >
                  {isLoggedIn ? "Profile" : "Log in"}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
