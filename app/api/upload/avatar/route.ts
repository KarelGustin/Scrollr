import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

  const supabase = await createSupabaseServerClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("Avatar upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${supabaseUrl}/storage/v1/object/public/uploads/${fileName}`;

  // Update the user's avatar URL in the database
  const { prisma } = await import("@/lib/prisma");
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: url },
  });

  return NextResponse.json({ url });
}
