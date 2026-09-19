import type { Metadata } from "next";
import { SeoArticlePage } from "@/app/components/SeoArticlePage";
import { seoArticles } from "@/app/lib/seo-articles";

const article = seoArticles.getPeopleToListen;

export const metadata: Metadata = {
  title: article.title,
  description: article.description,
};

export default function GetPeopleToListenPage() {
  return <SeoArticlePage article={article} />;
}
