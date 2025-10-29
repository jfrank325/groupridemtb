// app/actions/createRide.ts
"use server";

import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation/userSchema";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    passwordHash: formData.get("passwordHash") as string,
    zip: formData.get("zip") as string | null,
  };

  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: parsed.data.passwordHash,
      zip: parsed.data.zip ? +parsed.data.zip :  null,
    },
  });

  revalidatePath("/users");
  return { success: true, user };
}
