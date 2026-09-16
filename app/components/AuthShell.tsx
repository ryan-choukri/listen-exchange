import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark, Surface } from "@/app/components/ui/design-system";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="paper-canvas relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-ink sm:px-6">
      <div className="absolute -left-16 top-24 size-52 rounded-full bg-coral/10 blur-3xl" />
      <div className="absolute -right-16 bottom-20 size-56 rounded-full bg-blue-soft/25 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex">
          <BrandMark />
        </Link>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-strong">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
        <Surface className="mt-6 p-5 sm:p-7">{children}</Surface>
        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </main>
  );
}
