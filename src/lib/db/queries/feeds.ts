import { db } from "..";
import { Feed, feeds } from "../schema";
import { eq, sql } from "drizzle-orm";
import { firstOrUndefined } from "./uttils";

export async function addFeed(
  userId: string,
  feedName: string,
  feedUrl: string,
) {
  const [result] = await db
    .insert(feeds)
    .values({ user_id: userId, name: feedName, url: feedUrl })
    .returning();
  return result;
}

export async function getAllFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function getFeedByUrl(url: string) {
  const result = await db.select().from(feeds).where(eq(feeds.url, url));
  return firstOrUndefined(result);
}

export async function markFeedFetched(feed: Feed) {
  await db
    .update(feeds)
    .set({ last_fetched_at: sql`NOW()` })
    .where(eq(feeds.id, feed.id));
}

export async function getNextFeedToFetch() {
  const result = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.last_fetched_at} desc nulls first`)
    .limit(1);
  return firstOrUndefined(result);
}
