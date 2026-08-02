"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { useDeleteUser, useUsers, type ManagedUser } from "@/hooks/useUsers";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";

const ROLE_VARIANT: Record<ManagedUser["role"], "default" | "secondary"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  STAFF: "secondary",
};

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ManagedUser | null>(null);

  const columns = React.useMemo<ColumnDef<ManagedUser, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.name}
            {row.original.id === currentUserId && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
          </span>
        ),
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone ?? "—"}</span>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant={ROLE_VARIANT[row.original.role]}>{row.original.role}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={row.original.id === currentUserId}
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [currentUserId],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Staff, managers, and admins for this restaurant.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      <DataTable columns={columns} data={users ?? []} loading={isLoading} searchPlaceholder="Search users…" emptyMessage="No users yet." />

      {(!users || users.length === 0) && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <UsersIcon className="h-8 w-8" />
          <p className="text-sm">Add your first team member.</p>
        </div>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleteUser.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteUser.mutateAsync(deleteTarget.id);
            toast.success("User deleted");
            setDeleteTarget(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Something went wrong");
          }
        }}
      />
    </div>
  );
}
