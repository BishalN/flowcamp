import type { Id } from "@flowcamp/backend/convex/_generated/dataModel";
import { Navigate, createFileRoute } from "@tanstack/react-router";

import { ToolPlaceholder } from "@/components/tool-placeholder";

export const Route = createFileRoute("/_authed/projects/$projectId/$tool")({
  component: ProjectToolPage,
});

const COPY: Record<string, { title: string; body: string }> = {
  messages: {
    title: "Message Board",
    body: "Post announcements and longer updates so the whole team can read them on their own time.",
  },
  todos: {
    title: "To-dos",
    body: "Track work with lists, assignments, and due dates. Nothing assigned yet — this area will fill in once the Todos slice ships.",
  },
  docs: {
    title: "Docs",
    body: "Write project docs with your team. Files will live alongside docs in a future update.",
  },
  files: {
    title: "Files",
    body: "Store and share files next to your docs. For now, treat Docs & Files as one surface from the overview.",
  },
  chat: {
    title: "Chat",
    body: "Quick back-and-forth for the project. Real-time chat arrives in a later slice — this is the right place for it.",
  },
  schedule: {
    title: "Schedule",
    body: "Schedule is on the roadmap but not part of foundation. Check back when we ship calendar integration.",
  },
};

function ProjectToolPage() {
  const { projectId, tool } = Route.useParams();
  const id = projectId as Id<"projects">;
  const meta = COPY[tool];

  if (!meta) {
    return <Navigate to="/projects/$projectId" params={{ projectId: id }} />;
  }

  return <ToolPlaceholder projectId={id} title={meta.title} body={meta.body} />;
}
