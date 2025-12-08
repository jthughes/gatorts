import { readConfig } from "src/config";
import { CommandHandler, UserCommandHandler } from "./command";
import { config } from "zod";
import { getUserByName } from "src/lib/db/queries/users";

// type middlewareLoggedIn = (handler: UserCommandHandler) => {};
export function middlewareLoggedIn(
  handler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const cfg = readConfig();
    const userName = cfg.currentUserName;
    if (!userName) {
      throw new Error("User not logged in");
    }

    const user = await getUserByName(userName);
    if (!user) {
      throw new Error(`User ${userName} not found`);
    }

    await handler(cmdName, user[0], ...args);
  };
}
