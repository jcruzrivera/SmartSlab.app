"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isDbConfigured } from "@/lib/db/client";
import {
  createProject,
  deleteProject,
  renameProject,
} from "@/lib/db/sfProjects";
import { getOrCreateCurrentDbUser } from "@/lib/db/users";
import { projectNameSchema } from "@/lib/validations/studio";

export type StudioFormState = {
  error?: string;
};

export async function createProjectAction(
  _prevState: StudioFormState,
  formData: FormData,
): Promise<StudioFormState> {
  if (!isDbConfigured()) {
    return { error: "The database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return { error: "You must be signed in to create a project." };
  }

  const parsed = projectNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: "Enter a project name (1-80 characters)." };
  }

  let projectId: string;
  try {
    const project = await createProject(user.id, parsed.data);
    if (!project) {
      return { error: "Could not create the project. Please try again." };
    }
    projectId = project.id;
  } catch {
    return { error: "Could not create the project. Please try again." };
  }

  revalidatePath("/account/smartfinder/studio");
  redirect(`/account/smartfinder/studio/${projectId}`);
}

export async function deleteProjectAction(
  projectId: string,
): Promise<StudioFormState> {
  if (!isDbConfigured()) {
    return { error: "The database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  try {
    const ok = await deleteProject(projectId, user.id);
    if (!ok) {
      return { error: "Project not found." };
    }
  } catch {
    return { error: "Could not delete the project. Please try again." };
  }

  revalidatePath("/account/smartfinder/studio");
  return {};
}

export async function renameProjectAction(
  projectId: string,
  name: string,
): Promise<StudioFormState> {
  if (!isDbConfigured()) {
    return { error: "The database is not configured yet." };
  }

  const user = await getOrCreateCurrentDbUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = projectNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: "Enter a project name (1-80 characters)." };
  }

  try {
    const ok = await renameProject(projectId, user.id, parsed.data);
    if (!ok) {
      return { error: "Project not found." };
    }
  } catch {
    return { error: "Could not rename the project. Please try again." };
  }

  revalidatePath("/account/smartfinder/studio");
  return {};
}
