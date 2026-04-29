import { redirect } from "next/navigation";
import MatchRoomClient from "./MatchRoomClient";
import { getCurrentSession } from "@/server/auth";

type MatchPageProps = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ playerId?: string }>;
};

export default async function MatchPage({ params, searchParams }: MatchPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const { matchId } = await params;
  const { playerId } = await searchParams;

  return <MatchRoomClient matchId={matchId} initialPlayerId={playerId ?? ""} />;
}
