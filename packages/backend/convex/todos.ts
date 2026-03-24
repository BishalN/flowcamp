import { ConvexError, v } from "convex/values";

import { requireAuthUserId, requireProjectMember } from "./appUser";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  todoCommentDocValidator,
  todoDocValidator,
  todoListDocValidator,
  todoStatusValidator,
} from "./validators";

// ── Helpers ──────────────────────────────────────────────────────────

type Ctx = QueryCtx | MutationCtx;

async function requireTodoAccess(ctx: Ctx, todoId: Id<"todos">) {
  const todo = await ctx.db.get(todoId);
  if (!todo) throw new ConvexError("Todo not found");
  const access = await requireProjectMember(ctx, todo.projectId);
  return { todo, ...access };
}

async function requireListAccess(ctx: Ctx, listId: Id<"todoLists">) {
  const list = await ctx.db.get(listId);
  if (!list) throw new ConvexError("Todo list not found");
  const access = await requireProjectMember(ctx, list.projectId);
  return { list, ...access };
}

async function touchProject(ctx: MutationCtx, projectId: Id<"projects">, now: number) {
  await ctx.db.patch(projectId, { lastActivityAt: now, updatedAt: now });
}

/**
 * Resolve a three-state optional arg (undefined = keep, null = clear, T = set)
 * against the current stored value.
 */
function resolveOptional<T>(
  argValue: T | null | undefined,
  currentValue: T | undefined,
): T | undefined {
  if (argValue === undefined) return currentValue;
  if (argValue === null) return undefined;
  return argValue;
}

// ── Queries ──────────────────────────────────────────────────────────

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: todoStatusValidator,
    mine: v.optional(v.boolean()),
  },
  returns: v.object({
    lists: v.array(todoListDocValidator),
    todos: v.array(todoDocValidator),
  }),
  handler: async (ctx, args) => {
    const { membership } = await requireProjectMember(ctx, args.projectId);

    const lists = await ctx.db
      .query("todoLists")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    let todos: Doc<"todos">[];
    if (args.mine) {
      todos = await ctx.db
        .query("todos")
        .withIndex("by_projectId_and_assigneeAuthUserId_and_status", (q) =>
          q
            .eq("projectId", args.projectId)
            .eq("assigneeAuthUserId", membership.authUserId)
            .eq("status", args.status),
        )
        .collect();
    } else {
      todos = await ctx.db
        .query("todos")
        .withIndex("by_projectId_and_status", (q) =>
          q.eq("projectId", args.projectId).eq("status", args.status),
        )
        .collect();
    }

    return { lists, todos };
  },
});

export const getDetail = query({
  args: { todoId: v.id("todos") },
  returns: v.object({
    todo: todoDocValidator,
    comments: v.array(todoCommentDocValidator),
  }),
  handler: async (ctx, args) => {
    const { todo } = await requireTodoAccess(ctx, args.todoId);

    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_todoId", (q) => q.eq("todoId", args.todoId))
      .order("asc")
      .collect();

    return { todo, comments };
  },
});

export const listAssignedOpen = query({
  args: {},
  returns: v.array(todoDocValidator),
  handler: async (ctx) => {
    const authUserId = await requireAuthUserId(ctx);
    return await ctx.db
      .query("todos")
      .withIndex("by_assigneeAuthUserId_and_status", (q) =>
        q.eq("assigneeAuthUserId", authUserId).eq("status", "open"),
      )
      .collect();
  },
});

export const listAssignedOverdue = query({
  args: { todayDateKey: v.string() },
  returns: v.array(todoDocValidator),
  handler: async (ctx, args) => {
    const authUserId = await requireAuthUserId(ctx);
    return await ctx.db
      .query("todos")
      .withIndex("by_assigneeAuthUserId_and_status_and_dueDateKey", (q) =>
        q
          .eq("assigneeAuthUserId", authUserId)
          .eq("status", "open")
          .lt("dueDateKey", args.todayDateKey),
      )
      .collect();
  },
});

// ── List Mutations ───────────────────────────────────────────────────

export const createList = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
  },
  returns: v.id("todoLists"),
  handler: async (ctx, args) => {
    const { project, membership } = await requireProjectMember(ctx, args.projectId);
    const trimmed = args.name.trim();
    if (trimmed.length === 0) throw new ConvexError("List name is required");

    const now = Date.now();
    const listId = await ctx.db.insert("todoLists", {
      workspaceId: project.workspaceId,
      projectId: args.projectId,
      name: trimmed,
      createdByAuthUserId: membership.authUserId,
      createdAt: now,
      updatedAt: now,
    });

    await touchProject(ctx, args.projectId, now);
    return listId;
  },
});

export const renameList = mutation({
  args: {
    listId: v.id("todoLists"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { list } = await requireListAccess(ctx, args.listId);
    const trimmed = args.name.trim();
    if (trimmed.length === 0) throw new ConvexError("List name is required");

    const now = Date.now();
    await ctx.db.patch(args.listId, { name: trimmed, updatedAt: now });
    await touchProject(ctx, list.projectId, now);
    return null;
  },
});

export const deleteList = mutation({
  args: { listId: v.id("todoLists") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { list } = await requireListAccess(ctx, args.listId);

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .collect();

    for (const todo of todos) {
      const comments = await ctx.db
        .query("todoComments")
        .withIndex("by_todoId", (q) => q.eq("todoId", todo._id))
        .collect();
      await Promise.all(comments.map((c) => ctx.db.delete(c._id)));
      await ctx.db.delete(todo._id);
    }

    await ctx.db.delete(args.listId);
    await touchProject(ctx, list.projectId, Date.now());
    return null;
  },
});

// ── Todo Mutations ───────────────────────────────────────────────────

export const createTodo = mutation({
  args: {
    listId: v.id("todoLists"),
    title: v.string(),
  },
  returns: v.id("todos"),
  handler: async (ctx, args) => {
    const { list, membership } = await requireListAccess(ctx, args.listId);
    const trimmed = args.title.trim();
    if (trimmed.length === 0) throw new ConvexError("Title is required");

    const now = Date.now();
    const todoId = await ctx.db.insert("todos", {
      workspaceId: list.workspaceId,
      projectId: list.projectId,
      listId: args.listId,
      title: trimmed,
      status: "open",
      createdByAuthUserId: membership.authUserId,
      createdAt: now,
      updatedAt: now,
    });

    await touchProject(ctx, list.projectId, now);
    return todoId;
  },
});

export const updateTodo = mutation({
  args: {
    todoId: v.id("todos"),
    title: v.optional(v.string()),
    descriptionMarkdown: v.optional(v.union(v.string(), v.null())),
    listId: v.optional(v.id("todoLists")),
    assigneeAuthUserId: v.optional(v.union(v.string(), v.null())),
    dueAt: v.optional(v.union(v.number(), v.null())),
    dueDateKey: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { todo, project } = await requireTodoAccess(ctx, args.todoId);

    if (args.title !== undefined) {
      const trimmed = args.title.trim();
      if (trimmed.length === 0) throw new ConvexError("Title is required");
    }

    if (args.listId !== undefined) {
      const newList = await ctx.db.get(args.listId);
      if (!newList || newList.projectId !== todo.projectId) {
        throw new ConvexError("Invalid list");
      }
    }

    if (args.assigneeAuthUserId !== undefined && args.assigneeAuthUserId !== null) {
      const assigneeMembership = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId_and_authUserId", (q) =>
          q
            .eq("workspaceId", project.workspaceId)
            .eq("authUserId", args.assigneeAuthUserId as string),
        )
        .unique();
      if (!assigneeMembership) throw new ConvexError("Assignee is not a workspace member");
    }

    const now = Date.now();
    const { _id, _creationTime, ...fields } = todo;

    await ctx.db.replace(args.todoId, {
      ...fields,
      title: args.title !== undefined ? args.title.trim() : fields.title,
      listId: args.listId ?? fields.listId,
      descriptionMarkdown: resolveOptional(args.descriptionMarkdown, fields.descriptionMarkdown),
      assigneeAuthUserId: resolveOptional(args.assigneeAuthUserId, fields.assigneeAuthUserId),
      dueAt: resolveOptional(args.dueAt, fields.dueAt),
      dueDateKey: resolveOptional(args.dueDateKey, fields.dueDateKey),
      updatedAt: now,
    });

    await touchProject(ctx, todo.projectId, now);
    return null;
  },
});

export const completeTodo = mutation({
  args: { todoId: v.id("todos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { todo } = await requireTodoAccess(ctx, args.todoId);
    if (todo.status === "completed") return null;

    const now = Date.now();
    await ctx.db.patch(args.todoId, {
      status: "completed" as const,
      completedAt: now,
      updatedAt: now,
    });
    await touchProject(ctx, todo.projectId, now);
    return null;
  },
});

export const reopenTodo = mutation({
  args: { todoId: v.id("todos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { todo } = await requireTodoAccess(ctx, args.todoId);
    if (todo.status === "open") return null;

    const now = Date.now();
    const { _id, _creationTime, completedAt, ...rest } = todo;
    await ctx.db.replace(args.todoId, {
      ...rest,
      status: "open" as const,
      updatedAt: now,
    });
    await touchProject(ctx, todo.projectId, now);
    return null;
  },
});

export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { todo } = await requireTodoAccess(ctx, args.todoId);

    const comments = await ctx.db
      .query("todoComments")
      .withIndex("by_todoId", (q) => q.eq("todoId", args.todoId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.delete(c._id)));
    await ctx.db.delete(args.todoId);

    await touchProject(ctx, todo.projectId, Date.now());
    return null;
  },
});

// ── Comment Mutations ────────────────────────────────────────────────

export const addComment = mutation({
  args: {
    todoId: v.id("todos"),
    bodyMarkdown: v.string(),
  },
  returns: v.id("todoComments"),
  handler: async (ctx, args) => {
    const { todo, membership } = await requireTodoAccess(ctx, args.todoId);
    const trimmed = args.bodyMarkdown.trim();
    if (trimmed.length === 0) throw new ConvexError("Comment cannot be empty");

    const now = Date.now();
    const commentId = await ctx.db.insert("todoComments", {
      todoId: args.todoId,
      authorAuthUserId: membership.authUserId,
      bodyMarkdown: trimmed,
      createdAt: now,
    });

    await touchProject(ctx, todo.projectId, now);
    return commentId;
  },
});
