import { Recoverable } from "node:repl";
import { setUser } from "src/config";
import { createUser, getUserByName } from "src/lib/db/queries/users";

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("login expects single argument <username>");
  }
  const username = args[0];
  try {
    const [record] = await getUserByName(username);
    setUser(record.name);
    console.log(`User "${username}" has successfully logged in`);
  } catch {
    throw new Error(`user "${username}" not found`);
  }
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("register expects single argument <username>");
  }
  try {
    const record = await createUser(args[0]);
    setUser(record.name);
    console.log(`user "${record.name}" created.`);
    console.log(record);
  } catch (err) {
    throw new Error(`unable to register new user`);
  }
}
