import { argv, exit } from "node:process";
import {
  CommandsRegistry,
  handlerLogin,
  registerCommand,
  runCommand,
} from "./command";
import { setUser, readConfig } from "./config";

function main() {
  const config = readConfig();
  const cmdRegistry: CommandsRegistry = {};
  registerCommand(cmdRegistry, "login", handlerLogin);

  const cmdName = argv[2];
  const cmdArg = argv.slice(3);

  if (cmdName == undefined) {
    console.log("Error: command missing");
    exit(1);
  }
  try {
    runCommand(cmdRegistry, cmdName, ...cmdArg);
  } catch (err) {
    console.log(` ${err}`);
    exit(1);
  }
}

main();
