import { Link, useRouterState } from "@tanstack/react-router";

import UserMenu from "@/components/user-menu";
import { cn } from "@flowcamp/ui/lib/utils";

const nav = [
  { to: "/dashboard" as const, label: "Home" },
  { to: "/projects" as const, label: "Projects" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3 md:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="font-semibold tracking-tight text-foreground/90 transition-opacity hover:opacity-80"
            >
              Flowcamp
            </Link>
            <nav className="flex items-center gap-1" aria-label="Primary">
              {nav.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors",
                      "hover:bg-muted/80 hover:text-foreground",
                      "motion-safe:active:scale-[0.98]",
                      active && "bg-muted/60 text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
