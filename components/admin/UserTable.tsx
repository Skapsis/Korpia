"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Shield, Trash2, User as UserIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  deleteUser,
  deleteUsersBulk,
  resetUserPassword,
  updateUserProfile,
  type ActionState,
} from "@/app/actions/user";

export type UserTableRow = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; role: true; groupId: true };
}>;

type UserTableProps = {
  users: UserTableRow[];
  groups: { id: string; name: string }[];
};

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null as string | null,
};

export function UserTable({ users, groups }: UserTableProps) {
  const [profileState, profileAction] = useActionState(updateUserProfile, INITIAL_STATE);
  const [resetState, resetAction] = useActionState(resetUserPassword, INITIAL_STATE);
  const [deleteState, deleteAction] = useActionState(deleteUser, INITIAL_STATE);
  const [bulkDeleteState, bulkDeleteAction] = useActionState(deleteUsersBulk, INITIAL_STATE);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isSingleDeleteModalOpen, setIsSingleDeleteModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);
  const resetModalRef = useRef<HTMLDivElement>(null);
  const bulkDeleteModalRef = useRef<HTMLDivElement>(null);
  const singleDeleteModalRef = useRef<HTMLDivElement>(null);

  const allVisibleUserIds = useMemo(() => users.map((user) => user.id), [users]);
  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    if (bulkDeleteState.success) {
      setSelectedUserIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  }, [bulkDeleteState.success]);

  useEffect(() => {
    if (resetState.success) {
      setIsResetModalOpen(false);
      setTargetUser(null);
      setNewPassword("");
      setPasswordError("");
    }
  }, [resetState.success]);

  useEffect(() => {
    if (deleteState.success) {
      setIsSingleDeleteModalOpen(false);
      setTargetUser(null);
      setSelectedUserIds((previous) =>
        targetUser ? previous.filter((id) => id !== targetUser.id) : previous
      );
    }
  }, [deleteState.success, targetUser]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUserIds((previous) =>
      previous.length === users.length ? [] : [...allVisibleUserIds]
    );
  };

  const openResetModal = (user: { id: string; email: string }) => {
    setTargetUser(user);
    setNewPassword("");
    setPasswordError("");
    setIsResetModalOpen(true);
  };

  const openSingleDeleteModal = (user: { id: string; email: string }) => {
    setTargetUser(user);
    setIsSingleDeleteModalOpen(true);
  };

  const validatePassword = () => {
    if (newPassword.trim().length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  useEffect(() => {
    const activeModalRef = isResetModalOpen
      ? resetModalRef
      : isBulkDeleteModalOpen
        ? bulkDeleteModalRef
        : isSingleDeleteModalOpen
          ? singleDeleteModalRef
          : null;

    if (!activeModalRef?.current) {
      return;
    }

    const modalElement = activeModalRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const setInitialFocus = () => {
      const focusableElements = Array.from(
        modalElement.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute("disabled"));
      const first = focusableElements[0];
      if (first) {
        first.focus();
      } else {
        modalElement.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsResetModalOpen(false);
        setIsBulkDeleteModalOpen(false);
        setIsSingleDeleteModalOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        modalElement.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    setInitialFocus();
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isResetModalOpen, isBulkDeleteModalOpen, isSingleDeleteModalOpen]);

  return (
    <div className="space-y-3">
      {(profileState.error ||
        profileState.message ||
        resetState.error ||
        resetState.message ||
        deleteState.error ||
        deleteState.message ||
        bulkDeleteState.error ||
        bulkDeleteState.message) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {profileState.error || resetState.error || deleteState.error || bulkDeleteState.error ? (
            <p className="text-red-600 dark:text-red-400">
              {profileState.error ?? resetState.error ?? deleteState.error ?? bulkDeleteState.error}
            </p>
          ) : (
            <p className="text-emerald-600 dark:text-emerald-400">
              {profileState.message ??
                resetState.message ??
                deleteState.message ??
                bulkDeleteState.message}
            </p>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Seleccionados: {selectedUserIds.length} de {users.length}.
        </p>
        <button
          type="button"
          onClick={() => setIsBulkDeleteModalOpen(true)}
          disabled={selectedUserIds.length === 0}
          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Borrar seleccionados
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todos"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  Selección
                </label>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Nombre / Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Rol actual
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    aria-label={`Seleccionar ${user.email}`}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name || "Sin nombre"}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={profileAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="text"
                      name="name"
                      defaultValue={user.name ?? ""}
                      placeholder="Nombre"
                      className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <select
                      name="groupId"
                      defaultValue={user.groupId ?? ""}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="">Sin grupo</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {user.role === "ADMIN" ? <Shield className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <form
                      action={resetAction}
                      className="inline-flex"
                    >
                      <button
                        type="button"
                        onClick={() => openResetModal({ id: user.id, email: user.email })}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Resetear clave
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => openSingleDeleteModal({ id: user.id, email: user.email })}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isResetModalOpen && targetUser ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={resetModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <span id="reset-password-title">Resetear contraseña</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Usuario: {targetUser.email}
            </p>
            <form
              action={resetAction}
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                if (!validatePassword()) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="userId" value={targetUser.id} />
              <div>
                <label
                  htmlFor="reset-password-input"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Nueva contraseña
                </label>
                <input
                  id="reset-password-input"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              {passwordError ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {passwordError}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setTargetUser(null);
                    setNewPassword("");
                    setPasswordError("");
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBulkDeleteModalOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={bulkDeleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <span id="bulk-delete-title">Confirmar borrado masivo</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Vas a eliminar {selectedUserIds.length} usuario(s). Esta acción no se puede deshacer.
            </p>
            <form action={bulkDeleteAction} className="mt-4">
              {selectedUserIds.map((userId) => (
                <input key={userId} type="hidden" name="userIds" value={userId} />
              ))}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Borrar seleccionados
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSingleDeleteModalOpen && targetUser ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={singleDeleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="single-delete-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <span id="single-delete-title">Confirmar eliminación</span>
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Se eliminará el usuario <span className="font-medium">{targetUser.email}</span>. Esta
              acción no se puede deshacer.
            </p>
            <form action={deleteAction} className="mt-4">
              <input type="hidden" name="userId" value={targetUser.id} />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSingleDeleteModalOpen(false);
                    setTargetUser(null);
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
