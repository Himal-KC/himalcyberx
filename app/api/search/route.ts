import { NextResponse } from "next/server";
import {
  normalizeSearchQuery,
  QUICK_SEARCH_LIMITS,
  searchPublishedContent,
} from "@/lib/supabase/public-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeSearchQuery(searchParams.get("q") ?? "");

  if (query.length < 2) {
    return NextResponse.json({
      articles: [],
      labs: [],
      tutorials: [],
    });
  }

  const results = await searchPublishedContent(query, {
    limits: QUICK_SEARCH_LIMITS,
  });

  return NextResponse.json(results);
}
