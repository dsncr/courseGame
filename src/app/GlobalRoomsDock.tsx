"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ActiveRoomsList from "./ActiveRoomsList";

export default function GlobalRoomsDock() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname === "/auth" || pathname === "/") {
    return null;
  }

  return (
    <div className="global-rooms-dock">
      <ActiveRoomsList compact />
    </div>
  );
}
