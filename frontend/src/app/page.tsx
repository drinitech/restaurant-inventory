import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  ChefHat,
  History,
  ShoppingCart,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RedirectIfSignedIn } from "@/components/shared/redirect-if-signed-in";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DriniStock: inventory, recipes and sales for restaurants",
  description:
    "Record a sale and every ingredient in the recipe is deducted from stock automatically. Cost and profit per dish, low-stock alerts and reports for restaurants and cafés.",
};

const features: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShoppingCart,
    title: "Sales deduct stock automatically",
    body: "Record \"2× cappuccino\" and the milk, coffee and sugar in its recipe come off the shelf count in one step.",
  },
  {
    icon: ChefHat,
    title: "Recipes with real costs",
    body: "Link every menu item to its ingredients and see what each dish costs to make and how much it earns.",
  },
  {
    icon: BellRing,
    title: "Low-stock alerts",
    body: "Set a minimum per ingredient and get warned before something runs out in the middle of a shift.",
  },
  {
    icon: BarChart3,
    title: "Reports that answer questions",
    body: "Best sellers, most profitable items, inventory value and weekly spend on incoming stock.",
  },
  {
    icon: History,
    title: "Every movement on record",
    body: "Deliveries, sales and losses are logged with who and when, so any number can be traced back.",
  },
  {
    icon: UsersRound,
    title: "Roles for the whole team",
    body: "Staff record stock and sales, managers handle recipes and reports, admins manage users.",
  },
];

const steps = [
  { title: "Add your ingredients", body: "Units (kg, g, L, ml, pieces), current stock and a low-stock threshold." },
  { title: "Build the menu", body: "Each menu item gets a recipe: which ingredients, and how much of each." },
  { title: "Record sales", body: "Stock updates itself, and the dashboard shows cost, profit and what's running low." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RedirectIfSignedIn />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              DS
            </span>
            DriniStock
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "hidden sm:inline-flex")}>
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]"
          />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pb-24 lg:pt-20">
            <div className="flex flex-col gap-6">
              <p className="w-fit rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                For restaurants, cafés and bars
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Know what&apos;s in your kitchen, and what every dish earns.
              </h1>
              <p className="max-w-xl text-lg text-pretty text-muted-foreground">
                DriniStock replaces the stock notebook. Record a sale and every ingredient in the recipe is deducted
                automatically, so your numbers match the shelves and you see real cost and profit per item.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                  Create an account
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                  Sign in
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <Image
                src="/dashboard-preview.png"
                alt="DriniStock dashboard with inventory value, most profitable item, best seller and low-stock alerts"
                width={1600}
                height={1000}
                priority
                sizes="(min-width: 1024px) 620px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="border-t border-border/60 bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 id="features-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything stock-related, in one place
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-xl border border-border bg-card p-5">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="how-heading" className="border-t border-border/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 id="how-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Up and running in three steps
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 font-mono text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="text-lg font-semibold">Ready to stop counting shelves by hand?</p>
                <p className="text-sm text-muted-foreground">Create an account or sign in to your restaurant.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/register" className={buttonVariants()}>
                  Create account
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          DriniStock: inventory, recipes and sales management.
        </div>
      </footer>
    </div>
  );
}
