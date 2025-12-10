import { getPostsForUser } from "src/lib/db/queries/posts";
import { User } from "src/lib/db/schema";

export async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (args.length > 1) {
    throw new Error(`${cmdName} expects 1 optional argument <limit>`);
  }
  let limit = 2;
  if (args.length == 1) {
    limit = parseInt(args[0]);
  }
  const posts = await getPostsForUser(user);
  for (const post of posts) {
    console.log(post);
  }
}
