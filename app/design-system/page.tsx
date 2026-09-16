import type { Metadata } from "next";
import { DesignSystemGallery } from "./DesignSystemGallery";

export const metadata: Metadata = {
  title: "Design System — ListenExchange",
  description:
    "Bibliothèque de composants et direction artistique de ListenExchange.",
};

export default function DesignSystemPage() {
  return <DesignSystemGallery />;
}
