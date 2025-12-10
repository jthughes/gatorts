import { desc, eq, getTableColumns } from "drizzle-orm";
import { db } from "..";
import { Feed, feed_follows, feeds, Post, posts, User } from "../schema";
import { RSSItem } from "src/commands/feeds";

export async function createPost(item: RSSItem, feed: Feed) {
  const pubDate = new Date(Date.parse(item.pubDate));
  const [newPost] = await db
    .insert(posts)
    .values({
      title: item.title,
      url: item.link,
      description: item.description,
      published_at: pubDate,
      feed_id: feed.id,
    })
    .returning();
  return newPost;
}

export async function getPostsForUser(user: User): Promise<Post[]> {
  const combined = await db
    .select({ ...getTableColumns(posts) })
    .from(posts)
    .innerJoin(feed_follows, eq(feed_follows.feed_id, posts.feed_id))
    .where(eq(feed_follows.user_id, user.id))
    .orderBy(desc(posts.published_at));

  return combined;
}
