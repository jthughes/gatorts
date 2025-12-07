import { XMLParser } from "fast-xml-parser";
import { readConfig } from "src/config";
import { addFeed, getAllFeeds, getFeedByUrl } from "src/lib/db/queries/feeds";
import {
  createFeedFollow,
  getFeedFollowsForUser,
} from "src/lib/db/queries/follows";
import { getUserByID, getUserByName } from "src/lib/db/queries/users";
import { Feed, User } from "src/lib/db/schema";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
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

export async function handlerAgg(cmdName: string, ...args: string[]) {
  // if (args.length !== 1) {
  //   throw new Error("login expects single argument <username>");
  // }
  const feedURL = "https://www.wagslane.dev/index.xml";

  console.log("The Zen of Proverbs Optimize for simplicity");
  // const feed = await fetchFeed(feedURL);
  // console.log(feed);
  // for (const item of feed.channel.item) {
  //   console.log(item);
  // }
}

export async function handlerAddFeed(cmdName: string, ...args: string[]) {
  if (args.length !== 2) {
    throw new Error("login expects arguments <feed_name> <feed_url>");
  }
  const cfg = readConfig();
  const username = cfg.currentUserName || "";
  const user = await getUserByName(username);
  const feedName = args[0];
  const feedURL = args[1];
  const result = await addFeed(user[0].id, feedName, feedURL);

  if (!result) {
    throw new Error("Failed to create feed");
  }
  console.log("Feed sucessfully created");

  const followResult = await createFeedFollow(feedURL);
  printFeed(result, user[0]);
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
    printFeed(feed, user[0]);
    console.log("");
  }
}

export async function handlerFollow(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("follow expects arguments <feed_url>");
  }
  const cfg = readConfig();
  const username = cfg.currentUserName || "";
  const user = await getUserByName(username);

  const feedURL = args[0];
  const feed = await getFeedByUrl(feedURL);
  const result = await createFeedFollow(feedURL);
  console.log(`${user[0].name} is now following the "${feed[0].name}" feed`);
}

export async function handlerFollowing(cmdName: string, ...args: string[]) {
  const cfg = readConfig();
  const username = cfg.currentUserName || "";

  const result = await getFeedFollowsForUser(username);
  console.log(`${username}'s followed feeds:`);
  for (const element of result) {
    console.log(`- ${element.feeds.name}`);
  }
}
