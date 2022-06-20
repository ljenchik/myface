import { Page } from "../models/api/page";
import { UserModel } from "../models/api/userModel";
import * as userRepo from "../repos/userRepo";
import { getPosts, getPostsByUserInteraction } from "../repos/postRepo";
import { User } from "../models/database/user";
import { CreateUserRequest } from "../models/api/createUserRequest";
import { parse } from "date-fns";

export async function getPageOfUsers(
  page: number,
  pageSize: number
): Promise<Page<UserModel>> {
  const users = await userRepo.getUsers(page, pageSize);
  const userCount = await userRepo.countUsers(page, pageSize);

  // This way of generating a list of post models is VERY inefficient
  // due to all the DB calls in the toPostModel function.
  // In total it will be (3N + 1) DB calls (where N is the number of items in page).
  // A better solution would be to do these joins in the SQL...
  // but that's quite a lot of effort without support from an ORM...
  // and we should get away with it for small local databases like ours.
  const userModels = await Promise.all(users.map(toUserModel));
  return {
    results: userModels,
    next:
      page * pageSize < userCount
        ? `/users/?page=${page + 1}&pageSize=${pageSize}`
        : null,
    previous: page > 1 ? `/posts/?page=${page - 1}&pageSize=${pageSize}` : null,
    total: userCount,
  };
}

export async function getUser(userId: number): Promise<UserModel> {
  const user = await userRepo.getUser(userId);
  return toUserModel(user);
}

export async function createUser(newUser: CreateUserRequest): Promise<void> {
  await userRepo.createUser(newUser);
}

async function toUserModel(user: User): Promise<UserModel> {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    coverImageUrl: user.coverImageUrl,
    profileImageUrl: user.profileImageUrl,
    posts: (await getPosts(1, 10, { postedById: user.id })).map((p) => ({
      id: p.id,
      message: p.message,
      imageUrl: p.imageUrl,
      createdAt: parse(p.createdAt, "yyyy-MM-dd HH:mm:ss", new Date()),
    })),
    likes: await getPostsByUserInteraction(1, 10, user.id, "LIKE"),
    dislikes: await getPostsByUserInteraction(1, 10, user.id, "DISLIKE"),
  };


 
  
}
