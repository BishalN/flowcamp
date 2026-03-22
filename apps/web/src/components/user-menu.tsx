import { api } from "@flowcamp/backend/convex/_generated/api";
import { Avatar, AvatarFallback } from "@flowcamp/ui/components/avatar";
import { Button } from "@flowcamp/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@flowcamp/ui/components/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";

import { authClient } from "@/lib/auth-client";

function initials(name: string | undefined) {
  if (!name) {
    return "?";
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export default function UserMenu() {
  const navigate = useNavigate();
  const user = useQuery(api.auth.getCurrentUser);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="gap-2 pr-3 pl-2" />}
      >
        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-primary/15 text-xs text-primary">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[9rem] truncate">{user?.name ?? "Account"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{user?.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: "/",
                    });
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
