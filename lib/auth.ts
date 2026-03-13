import { createSupabaseServerClient } from "./supabase-server";
import { prisma } from "./prisma";

export interface AppUser {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

/**
 * Get the currently authenticated user from Supabase session + Prisma.
 * Returns null if not authenticated or no matching Prisma user found.
 */
export async function getUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) return null;

  // Find or create the Prisma user based on Supabase auth email
  let dbUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
    },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name ?? null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }

  return dbUser;
}
