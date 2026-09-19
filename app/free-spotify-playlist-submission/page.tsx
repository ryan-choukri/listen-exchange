import type { Metadata } from "next";
import { SeoArticlePage } from "@/app/components/SeoArticlePage";
import { seoArticles } from "@/app/lib/seo-articles";

const article = seoArticles.freePlaylistSubmission;

export const metadata: Metadata = {
  title: article.title,
  description: article.description,
};

export default function FreeSpotifyPlaylistSubmissionPage() {
  return <SeoArticlePage article={article} />;
}
