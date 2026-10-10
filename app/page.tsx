import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div>
      <section id="hero" className="mx-auto grid w-full max-w-6xl scroll-mt-16 items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <p className="text-sm font-medium text-muted-foreground">Personal finance workspace</p>
          <h1 className="font-heading max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            See the month clearly before the money disappears.
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Ledger reads expenses, savings, debt, and actions from a Google
            Sheet. Sign in with Google, pick a spreadsheet, and keep the numbers
            as integer cents.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link
              href="/#about"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              How it works
            </Link>
          </div>
        </div>
        <Image
          src="/hero-ledger.svg"
          alt="Preview of a monthly ledger spreadsheet"
          width={960}
          height={640}
          priority
          className="h-auto w-full rounded-xl ring-1 ring-foreground/10"
        />
      </section>

      <section id="about" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">About</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Built for people who want a quiet spreadsheet, not another noisy dashboard.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            <div>
              <h3 className="font-medium">Google sign-in</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Connect with Google OAuth and grant Sheets access. Tokens are
                stored. Email and passwords are not.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Pick a sheet</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose which spreadsheet to read. Ledger never writes back to it.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Five tabs</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Expenses, Savings, Income, Debt, and Actions map to the columns
                in your sheet.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Read only</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Edit numbers in Google Sheets. This app only displays them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="location" className="mx-auto grid w-full max-w-6xl scroll-mt-16 items-center gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">Location</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Ledger HQ is in downtown Denver. Stop by if you want a walkthrough of
            the workspace, or just use the app from wherever the bills land.
          </p>
          <address className="mt-6 not-italic text-sm leading-7">
            120 Market Street
            <br />
            Denver, CO 80202
            <br />
            Weekdays 9:00–17:00
          </address>
        </div>
        <Image
          src="/location-map.svg"
          alt="Map illustration of Ledger headquarters at 120 Market Street"
          width={800}
          height={520}
          className="h-auto w-full rounded-xl ring-1 ring-foreground/10"
        />
      </section>
    </div>
  );
}
