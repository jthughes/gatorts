import { db } from "..";
import { users, feeds, feed_follows, User, Feed } from "../schema";
import { and, eq } from "drizzle-orm";
import { getUserByName } from "./users";
import { readConfig } from "src/config";

export async function createFeedFollow(feed: Feed, user: User) {
  const [newFollow] = await db
    .insert(feed_follows)
    .values({
      feed_id: feed.id,
      user_id: user.id,
    })
    .returning();

  const [result] = await db
    .select()
    .from(feed_follows)
    .where(eq(feed_follows.id, newFollow.id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id));
  return result;
}

export async function getFeedFollowsForUser(user: User) {
  const result = await db
    .select()
    .from(feed_follows)
    .where(eq(feed_follows.user_id, user.id))
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id));
  return result;
}

export async function removeFeedFollowForUser(user: User, feed: Feed) {
  const [result] = await db
    .delete(feed_follows)
    .where(
      and(eq(feed_follows.user_id, user.id), eq(feed_follows.feed_id, feed.id)),
    )
    .returning();
  return result;
}
