import { Link } from "@tanstack/react-router";
import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";

import { buttonVariants } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { cn } from "@flowcamp/ui/lib/utils";

export function ToolPlaceholder({
  projectId,
  title,
  body,
  backLabel = "Back to project",
}: {
  projectId: Id<"projects">;
  title: string;
  body: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-12 md:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <Card className="bg-muted/25 ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-base">Coming together</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            This tool will connect to your workspace data in a future slice. For now, use the
            overview to move between areas.
          </p>
          <Link
            to="/projects/$projectId"
            params={{ projectId }}
            className={cn(buttonVariants({ variant: "outline" }), "w-fit rounded-full")}
          >
            {backLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
