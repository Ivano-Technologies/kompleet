"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    setLoading(true);

    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Unexpected logout error:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: "8px 16px",
        fontSize: "14px",
        backgroundColor: loading ? "#ccc" : "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
