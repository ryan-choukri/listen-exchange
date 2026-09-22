import type { Metadata } from "next";
import { SeoArticlePage } from "@/app/components/SeoArticlePage";
import { seoArticles } from "@/app/lib/seo-articles";

const article = seoArticles.freeSpotifyStreams;

export const metadata: Metadata = {
  title: article.title,
  description: article.description,
};

export default function FreeSpotifyStreamsPage() {
  return <SeoArticlePage article={article} />;
}
