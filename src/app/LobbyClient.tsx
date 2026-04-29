"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiPost, getErrorMessage } from "@/lib/api";
import ActiveRoomsList from "./ActiveRoomsList";

type LobbyClientProps = {
  userEmail: string;
  userImage: string;
  userName: string;
};

export default function LobbyClient({
  userEmail,
  userImage,
  userName,
}: LobbyClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"bot" | "multiplayer">("multiplayer");
  const [maxPlayers, setMaxPlayers] = useState<2 | 3>(2);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState(userName);
  const [profileImage, setProfileImage] = useState(userImage);
  const [profileMessage, setProfileMessage] = useState("");

  async function playWithBot() {
    setLoading(true);
    setMessage("");
    try {
      const room = await apiPost<{ matchId: string; playerId: string }>(
        "/api/lobby",
        "createBotRoom",
        {},
      );
      router.push(`/game?matchId=${room.matchId}&playerId=${room.playerId}`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function createRoom() {
    setLoading(true);
    setMessage("");
    try {
      const room = await apiPost<{ matchId: string; playerId: string }>(
        "/api/lobby",
        "createRoom",
        { maxPlayers },
      );
      router.push(`/match/${room.matchId}?playerId=${room.playerId}`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setProfileMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, image: profileImage }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Не удалось сохранить профиль.");
      }
      setProfileMessage("Профиль сохранен.");
      router.refresh();
    } catch (error) {
      setProfileMessage(getErrorMessage(error));
    }
  }

  async function logout() {
    await authClient.signOut();
    window.location.href = "/auth";
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage("Выберите файл изображения.");
      return;
    }
    if (file.size > 300_000) {
      setProfileMessage("Аватар должен быть меньше 300 KB.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setProfileImage(dataUrl);
    setProfileMessage("Аватар выбран. Нажмите сохранить.");
  }

  return (
    <main className="page-container">
      <div className="layout-grid max-w-6xl mx-auto p-6">
        <div className="main-content space-y-6">
          {/* Heading */}
          <div className="space-y-2">
            <p className="eyebrow">Привет, {profileName}</p>
            <h1 className="text-4xl font-bold">Выберите режим</h1>
            <p className="text-text-secondary">
              Создайте комнату для друзей, подключитесь к активной игре или сразу
              начните матч с ботом.
            </p>
          </div>

          {/* Profile */}
          <div className="card flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden shrink-0">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                profileName.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-text-secondary">{userEmail}</p>
              <label className="block space-y-1">
                <span className="text-xs text-text-secondary font-semibold">Имя</span>
                <input
                  className="input-field"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-text-secondary font-semibold">Аватар</span>
                <input className="input-field py-2" accept="image/*" onChange={uploadAvatar} type="file" />
              </label>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-primary" onClick={saveProfile} type="button">
                  Сохранить
                </button>
                <button className="btn-secondary" onClick={logout} type="button">
                  Выйти
                </button>
              </div>
              {profileMessage && (
                <p className="text-accent text-sm font-semibold">{profileMessage}</p>
              )}
            </div>
          </div>

          {/* Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              className={`card text-left space-y-2 transition-all hover:border-primary/40 ${
                mode === "bot" ? "border-primary shadow-glow" : ""
              }`}
              onClick={() => setMode("bot")}
              type="button"
            >
              <strong className="text-lg block">Играть с ботом</strong>
              <span className="text-text-secondary text-sm">Матч создается и запускается сразу.</span>
            </button>
            <button
              className={`card text-left space-y-2 transition-all hover:border-primary/40 ${
                mode === "multiplayer" ? "border-primary shadow-glow" : ""
              }`}
              onClick={() => setMode("multiplayer")}
              type="button"
            >
              <strong className="text-lg block">Многопользовательская игра</strong>
              <span className="text-text-secondary text-sm">Создайте комнату на 2 или 3 игроков.</span>
            </button>
          </div>

          {/* Action Panel */}
          <div className="card space-y-4">
            {mode === "bot" ? (
              <>
                <h2 className="text-2xl font-semibold">Быстрый матч</h2>
                <button className="btn-primary" onClick={playWithBot} disabled={loading}>
                  Играть с ботом
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">Создать комнату</h2>
                <div className="flex gap-2 p-1 rounded-xl bg-bg border border-border w-fit">
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      maxPlayers === 2 ? "bg-primary text-white" : "text-text-secondary hover:text-white"
                    }`}
                    onClick={() => setMaxPlayers(2)}
                    type="button"
                  >
                    2 игрока
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      maxPlayers === 3 ? "bg-primary text-white" : "text-text-secondary hover:text-white"
                    }`}
                    onClick={() => setMaxPlayers(3)}
                    type="button"
                  >
                    3 игрока
                  </button>
                </div>
                <button className="btn-primary" onClick={createRoom} disabled={loading}>
                  Создать
                </button>
              </>
            )}
          </div>

          {message && <p className="text-error font-bold">{message}</p>}
        </div>

        <div className="sidebar">
          <ActiveRoomsList onError={setMessage} />
        </div>
      </div>
    </main>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("Не удалось прочитать файл.")));
    reader.readAsDataURL(file);
  });
}
