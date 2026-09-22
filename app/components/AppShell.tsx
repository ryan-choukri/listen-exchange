import { Suspense, type ReactNode } from "react";
import { Navbar } from "@/app/components/Navbar";
import { OnboardingCoachMarks } from "@/app/components/onboarding/OnboardingCoachMarks";

export function AppShell({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "narrow" | "medium" | "wide";
}) {
  const widths = {
    narrow: "max-w-2xl",
    medium: "max-w-4xl",
    wide: "max-w-6xl",
  };

  return (
    <div className="paper-canvas min-h-screen bg-background text-ink">
      <Navbar />
      <Suspense fallback={null}>
        <OnboardingCoachMarks />
      </Suspense>
      <main className="pb-24 lg:ml-56 lg:pb-0">
        <div
          className={`mx-auto ${widths[width]} px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
