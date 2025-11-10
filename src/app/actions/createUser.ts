"use server";

import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation/userSchema";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { fetchLatLngForZip } from "@/lib/utils";

export async function createUser(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    zip: (formData.get("zip") ?? "") as string,
  };

  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { error: { email: ["An account with this email already exists"] } };
  }

  // Hash password server-side (security best practice)
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    let lat: number | null = null;
    let lng: number | null = null;

    const zip = parsed.data.zip;

    if (zip) {
      const coords = await fetchLatLngForZip(zip);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        zip: Number.parseInt(zip, 10),
        lat,
        lng,
      },
    });

    revalidatePath("/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: { _form: ["Failed to create account. Please try again."] } };
  }
}
