import { db } from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { firstOrUndefined } from "./uttils";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name: name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const result = await db.select().from(users).where(eq(users.name, name));
  return firstOrUndefined(result);
}

export async function getUserByID(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return firstOrUndefined(result);
}

export async function clearUsersTable() {
  await db.delete(users);
}

export async function getAllUsers() {
  return db.select().from(users);
}
