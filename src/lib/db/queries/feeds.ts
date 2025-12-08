import { db } from "..";
import { feeds } from "../schema";
import { eq } from "drizzle-orm";
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
