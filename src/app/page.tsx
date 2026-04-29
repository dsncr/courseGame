import { redirect } from "next/navigation";
import LobbyClient from "./LobbyClient";
import { getCurrentSession } from "@/server/auth";

export default async function Home() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <LobbyClient
      userEmail={session.user.email}
      userImage={session.user.image ?? ""}
      userName={session.user.name}
    />
  );
}
