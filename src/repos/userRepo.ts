import { database, single } from "./database";
import { User } from "../models/database/user";
import { InteractionType } from "../models/database/interaction";
import { CreateUserRequest } from "../models/api/createUserRequest";
import knex from "knex";

function usersQuery(page: number, pageSize: number): knex.QueryBuilder {
  return database<User>("users").select("*");
}

export async function getUsers(
  page: number,
  pageSize: number
): Promise<User[]> {
  return usersQuery(page, pageSize)
    .orderBy("username", "asc")
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function countUsers(
  page: number,
  pageSize: number
): Promise<number> {
  const result = await usersQuery(page, pageSize).count({ count: "*" }).first();
  return result["count"];
}

export async function getUser(userId: number): Promise<User> {
  const users = await database<User>("users").select("*").where("id", userId);

  return single(users);
}

export async function getUserByPostId(postId: number): Promise<User> {
  const user = await database<User>("users")
  .innerJoin("posts", "posts.userId", "users.id")
  .select("users.*")
  .where("posts.id", postId);
  return single(user);
}


export async function getByPostInteraction(
  postId: number,
  interactionType: InteractionType,
  page: number,
  pageSize: number
): Promise<User[]> {
  return database<User>("users")
    .innerJoin("interactions", "interactions.userId", "users.id")
    .innerJoin("posts", "interactions.postId", "posts.id")
    .select("users.*")
    .where("posts.id", postId)
    .where("interactions.interactionType", interactionType)
    .orderBy("username", "asc")
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function createUser(newUser: CreateUserRequest): Promise<void> {
  await database<User>("users").insert({
    name: newUser.name,
    email: newUser.email,
    username: newUser.username,
    coverImageUrl: newUser.coverImageUrl,
    profileImageUrl: newUser.profileImageUrl,
  });
}
