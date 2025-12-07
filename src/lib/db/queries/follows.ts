import { db } from "..";
import { users, feeds, feed_follows } from "../schema";
import { eq } from "drizzle-orm";
import { getUserByName } from "./users";
import { readConfig } from "src/config";

export async function createFeedFollow(feedURL: string) {
  const feed = await db.select().from(feeds).where(eq(feeds.url, feedURL));
  const cfg = readConfig();
  const userName = cfg.currentUserName || "";
  const user = await getUserByName(userName);

  const result = await db
    .insert(feed_follows)
    .values({
      feed_id: feed[0].id,
      user_id: user[0].id,
    })
    .returning();

  const join = db
    .select()
    .from(feed_follows)
    .where(eq(feed_follows.id, result[0].id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id));
  return join;
}

export async function getFeedFollowsForUser(userName: string) {
  const user_id = await getUserByName(userName);
  const result = db
    .select()
    .from(feed_follows)
    .where(eq(feed_follows.user_id, user_id[0].id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id));
  return result;
}
