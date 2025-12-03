import { argv, exit } from "node:process";

import { readConfig } from "./config";
import {
  CommandsRegistry,
  registerCommand,
  runCommand,
} from "./commands/command";
import { handlerLogin, handlerRegister } from "./commands/users";

async function main() {
  const config = readConfig();
  const cmdRegistry: CommandsRegistry = {};
  registerCommand(cmdRegistry, "login", handlerLogin);
  registerCommand(cmdRegistry, "register", handlerRegister);

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
