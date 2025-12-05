import { argv, exit } from "node:process";

import { readConfig } from "./config";
import {
  CommandsRegistry,
  registerCommand,
  runCommand,
} from "./commands/command";
import {
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
} from "./commands/users";
import { handlerAddFeed, handlerAgg, handlerFeeds } from "./commands/feeds";

async function main() {
  const cmdRegistry: CommandsRegistry = {};
  registerCommand(cmdRegistry, "login", handlerLogin);
  registerCommand(cmdRegistry, "register", handlerRegister);
  registerCommand(cmdRegistry, "reset", handlerReset);
  registerCommand(cmdRegistry, "users", handlerUsers);
  registerCommand(cmdRegistry, "agg", handlerAgg);
  registerCommand(cmdRegistry, "addfeed", handlerAddFeed);
  registerCommand(cmdRegistry, "feeds", handlerFeeds);

  const cmdName = argv[2];
  const cmdArg = argv.slice(3);

  if (cmdName == undefined) {
    console.log("Error: command missing");
    exit(1);
  }
  try {
    await runCommand(cmdRegistry, cmdName, ...cmdArg);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`Error: ${err.message}`);
    } else {
      console.log(`Error: ${err}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main();
