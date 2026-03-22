import { api } from "@flowcamp/backend/convex/_generated/api";
import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  CalendarClockIcon,
  FileTextIcon,
  ListTodoIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  UserPlusIcon,
} from "lucide-react";
import { useState } from "react";

import { InvitePeopleDialog } from "@/components/invite-people-dialog";

import { Badge } from "@flowcamp/ui/components/badge";
import { Button } from "@flowcamp/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flowcamp/ui/components/card";
import { cn } from "@flowcamp/ui/lib/utils";

export const Route = createFileRoute("/_authed/projects/$projectId/")({
  component: ProjectOverviewPage,
});

const TOOL_LINKS: {
  segment: string;
  title: string;
  description: string;
  icon: typeof MessageSquareIcon;
}[] = [
  {
    segment: "messages",
    title: "Message Board",
    description: "Long-form updates and announcements for everyone on the project.",
    icon: MessageSquareIcon,
  },
  {
    segment: "todos",
    title: "To-dos",
    description: "Lists, assignments, and due dates — all in one calm surface.",
    icon: ListTodoIcon,
  },
  {
    segment: "docs",
    title: "Docs & Files",
    description: "Write docs and keep files alongside them, organized by project.",
    icon: FileTextIcon,
  },
  {
    segment: "chat",
    title: "Chat",
    description: "Quick questions and real-time conversation without leaving Flowcamp.",
    icon: MessagesSquareIcon,
  },
];

function ProjectOverviewPage() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const shell = useQuery(api.projects.getShell, { projectId: id });
  const [inviteOpen, setInviteOpen] = useState(false);

  if (shell === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  const isOwner = shell.role === "owner";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">{shell.workspace.name}</p>
        <h1 className="max-w-2xl font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {shell.project.name}
        </h1>
        {shell.project.description ? (
          <p className="max-w-xl text-sm text-muted-foreground">{shell.project.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-full font-normal">
            Active
          </Badge>
          <span>No updates yet — pick a tool below to get started.</span>
        </div>
        {isOwner ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlusIcon data-icon="inline-start" />
            Invite people
          </Button>
        ) : null}
      </header>

      <InvitePeopleDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <section className="grid gap-4 sm:grid-cols-2">
        {TOOL_LINKS.map(({ segment, title, description, icon: Icon }) => (
          <Link
            key={segment}
            to="/projects/$projectId/$tool"
            params={{ projectId: id, tool: segment }}
            className={cn(
              "group block rounded-2xl outline-none ring-1 ring-border/70 transition-shadow",
              "hover:shadow-md hover:ring-primary/20",
              "motion-safe:active:scale-[0.995]",
            )}
          >
            <Card className="h-full border-0 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  Open {title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {shell.deferredTools.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Later
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {shell.deferredTools.map((t) => (
              <Card
                key={t.id}
                className="border-dashed border-muted-foreground/25 bg-muted/20 opacity-80"
              >
                <CardHeader className="flex flex-row items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <CalendarClockIcon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">{t.label}</CardTitle>
                    <CardDescription>Planned — not available in this slice yet.</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
