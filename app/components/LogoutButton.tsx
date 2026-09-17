"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Button, type ButtonProps } from "@/app/components/Button";
import { useState } from "react";
import { useCurrentUser } from "@/app/components/CurrentUserProvider";

interface LogoutButtonProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function LogoutButton({
  variant = "secondary",
  size = "sm",
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const { clearUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    clearUser();
    try {
      await signOut();
      // signOut redirects, but we add this as a safety fallback
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect the user
      router.push("/auth/login");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogout();
      }}
    >
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={className}
        loading={isLoading}
      >
        {isLoading ? "Signing out..." : "Sign Out"}
      </Button>
    </form>
  );
}
