import { redirect } from "next/navigation";
import GameClient from "./GameClient";
import { getCurrentSession } from "@/server/auth";

type GamePageProps = {
  searchParams: Promise<{
    matchId?: string;
    playerId?: string;
  }>;
};

export default async function GamePage({ searchParams }: GamePageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const params = await searchParams;

  return (
    <GameClient
      initialMatchId={params.matchId ?? ""}
      initialPlayerId={params.playerId ?? ""}
      initialPlayerName={session.user.name}
    />
  );
}
