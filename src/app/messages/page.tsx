import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { MessagesClient } from "../components/MessagesClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col w-full font-inter bg-gray-50 text-gray-900 md:px-20 py-20 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6">Messages</h1>
      <MessagesClient />
    </main>
  );
}

