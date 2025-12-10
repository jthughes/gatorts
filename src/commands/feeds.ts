import { XMLParser } from "fast-xml-parser";

import {
  addFeed,
  getAllFeeds,
  getFeedByUrl,
  getNextFeedToFetch,
  markFeedFetched,
} from "src/lib/db/queries/feeds";
import {
  createFeedFollow,
  getFeedFollowsForUser,
  removeFeedFollowForUser,
} from "src/lib/db/queries/follows";
import { createPost } from "src/lib/db/queries/posts";
import { getUserByID } from "src/lib/db/queries/users";
import { Feed, User } from "src/lib/db/schema";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string) {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
      accept: "application/rss+xml",
    },
  });
  if (!response.ok) {
    throw new Error(
      `failed to fetch feed: ${response.status} ${response.statusText}`,
    );
  }
  const feedText = await response.text();
  const parser = new XMLParser();
  const feed = parser.parse(feedText);
  console.log(feed.rss);
  if (
    feed.rss.hasOwnProperty("channel") == false ||
    feed.rss.channel.hasOwnProperty("title") == false ||
    feed.rss.channel.hasOwnProperty("link") == false ||
    feed.rss.channel.hasOwnProperty("description") == false ||
    feed.rss.channel.hasOwnProperty("item") == false
  ) {
    console.log(feed.channel);
    throw new Error("invalid xml: properties not found");
  }

  if (
    feed.rss.channel.hasOwnProperty("item") &&
    Array.isArray(feed.rss.channel.item) == false
  ) {
    feed.channel.item = [];
  }

  const rssFeed: RSSFeed = {
    channel: {
      title: feed.rss.channel.title,
      link: feed.rss.channel.link,
      description: feed.rss.channel.description,
      item: [],
    },
  };

  for (const element of feed.rss.channel.item) {
    if (
      element.hasOwnProperty("title") &&
      element.hasOwnProperty("link") &&
      element.hasOwnProperty("description") &&
      element.hasOwnProperty("pubDate")
    ) {
      const item: RSSItem = {
        title: element.title,
        link: element.link,
        description: element.description,
        pubDate: element.pubDate,
      };
      rssFeed.channel.item.push(item);
    }
  }
  return rssFeed;
}

async function scrapeFeeds() {
  const nextFeed = await getNextFeedToFetch();
  if (nextFeed == undefined) {
    throw new Error("feed not found");
  }
  await markFeedFetched(nextFeed);
  const rss = await fetchFeed(nextFeed.url);
  console.log(`${rss.channel.title} <${rss.channel.link}>`);
  for (const item of rss.channel.item) {
    console.log(`- ${item.title}`);
    createPost(item, nextFeed);
  }
  console.log("");
}

function parseDuration(durationStr: string): number {
  let order_of_magnitude: number = 1;
  let text: string = "";
  if (durationStr.endsWith("ms")) {
    text = durationStr.slice(0, text.lastIndexOf("ms"));
  } else if (durationStr.endsWith("s")) {
    text = durationStr.slice(0, text.lastIndexOf("s"));
    order_of_magnitude = 1000;
  } else if (durationStr.endsWith("m")) {
    text = durationStr.slice(0, text.lastIndexOf("m"));
    order_of_magnitude = 1000 * 60;
  } else if (durationStr.endsWith("h")) {
    text = durationStr.slice(0, text.lastIndexOf("h"));
    order_of_magnitude = 1000 * 60 * 60;
  } else {
    throw new Error("invalid duration unit");
  }
  const number = parseInt(text, 10);
  if (isNaN(number)) {
    throw new Error("invalid duration number");
  }
  return number * order_of_magnitude;
}

function handleError(err: unknown) {
  console.log(
    `Error scraping feeds: ${err instanceof Error ? err.message : err}`,
  );
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error(`${cmdName} expects single argument <time_between_reqs>`);
  }

  const timeText = args[0];
  const time_between_reqs_ms = parseDuration(timeText);

  scrapeFeeds().catch(handleError);

  console.log(`Collecting feeds every ${timeText}`);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, time_between_reqs_ms);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length !== 2) {
    throw new Error(`${cmdName} expects arguments <feed_name> <feed_url>`);
  }

  const feedName = args[0];
  const feedURL = args[1];
  const result = await addFeed(user.id, feedName, feedURL);

  if (!result) {
    throw new Error("Failed to create feed");
  }
  console.log("Feed sucessfully created");

  const followResult = await createFeedFollow(result, user);
  printFeed(result, user);
}

function printFeed(feed: Feed, user: User) {
  console.log(`- ID:      ${feed.id}`);
  console.log(`- Created: ${feed.createdAt}`);
  console.log(`- Updated: ${feed.updatedAt}`);
  console.log(`- name:    ${feed.name}`);
  console.log(`- URL:     ${feed.url}`);
  console.log(`- User:    ${user.name}`);
}

export async function handlerFeeds(cmdName: string, ...args: string[]) {
  const result = await getAllFeeds();
  for (const feed of result) {
    const user = await getUserByID(feed.user_id);
    if (!user) {
      continue;
    }
    printFeed(feed, user);
    console.log("");
  }
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length !== 1) {
    throw new Error(`${cmdName} expects arguments <feed_url>`);
  }

  const feedURL = args[0];
  const feed = await getFeedByUrl(feedURL);
  if (!feed) {
    throw new Error(`Feed "${feedURL} not found`);
  }
  const result = await createFeedFollow(feed, user);
  console.log(`${user.name} is now following the "${feed.name}" feed`);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const result = await getFeedFollowsForUser(user);
  console.log(`${user.name}'s followed feeds:`);
  for (const element of result) {
    console.log(`- ${element.feeds.name}`);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length !== 1) {
    throw new Error(`${cmdName} expects 1 argument: <feed_url>`);
  }
  const feedURL = args[0];
  const feed = await getFeedByUrl(feedURL);
  if (!feed) {
    throw new Error("");
  }
  const result = await removeFeedFollowForUser(user, feed);
}
