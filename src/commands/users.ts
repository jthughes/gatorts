import { readConfig, setUser } from "src/config";
import {
  clearUsersTable,
  createUser,
  getAllUsers,
  getUserByName,
} from "src/lib/db/queries/users";

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error("login expects single argument <username>");
  }
  const username = args[0];
  try {
    const record = await getUserByName(username);
    if (!record) {
      throw new Error("");
    }
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

export async function handlerReset(cmdName: string, ...args: string[]) {
  try {
    const result = await clearUsersTable();
    console.log("removed all users successfully");
  } catch (err) {
    console.log(`failed to remove users: ${err}`);
  }
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
  try {
    const result = await getAllUsers();

    const config = readConfig();
    const currentUser = config.currentUserName;

    for (const entry of result) {
      if (currentUser == undefined || entry.name != currentUser) {
        console.log(`* ${entry.name}`);
      } else {
        console.log(`* ${entry.name} (current)`);
      }
    }
  } catch (err) {
    console.log(`failed to display users: ${err}`);
  }
}
