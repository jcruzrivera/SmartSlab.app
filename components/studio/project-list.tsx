"use client";

import {
  useActionState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createProjectAction,
  deleteProjectAction,
  type StudioFormState,
} from "@/app/account/smartfinder/studio/actions";
import { peekSmartfinderSeed } from "@/lib/smartfinder/handoff";
import { toast } from "@/lib/notifications/toast-store";

type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  pieceCount: number;
  updatedAt: string;
};

const INITIAL_STATE: StudioFormState = {};

export function StudioProjectList({
  projects,
}: {
  projects: ProjectSummary[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    INITIAL_STATE,
  );
  const [isDeleting, startDelete] = useTransition();
  // sessionStorage seed — server snapshot is always 0 so hydration matches.
  const seedCount = useSyncExternalStore(
    () => () => {},
    () => peekSmartfinderSeed()?.length ?? 0,
    () => 0,
  );

  function handleDelete(project: ProjectSummary) {
    if (
      !window.confirm(
        `Delete "${project.name}" and its ${project.pieceCount} piece${project.pieceCount === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }
    startDelete(async () => {
      const result = await deleteProjectAction(project.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {seedCount > 0 ? (
        <div className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          {seedCount} piece{seedCount === 1 ? "" : "s"} from SmartFinder ready
          to import — create or open a project and they&apos;ll be added
          automatically.
        </div>
      ) : null}

      <form action={formAction} className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-56">
          <input
            type="text"
            name="name"
            required
            maxLength={80}
            placeholder="New project name (e.g. Smith kitchen)"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand dark:border-slate-600 dark:bg-slate-900"
          />
          {state.error ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create project"}
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No projects yet. Create one to start drawing your countertops.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {project.pieceCount} piece
                    {project.pieceCount === 1 ? "" : "s"} · updated{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {project.status}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/account/smartfinder/studio/${project.id}`}
                  className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-sm font-medium text-white transition hover:bg-brand-strong"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  disabled={isDeleting}
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-600 transition hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
