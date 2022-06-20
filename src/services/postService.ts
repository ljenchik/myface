import { Page } from "../models/api/page";
import { PostModel } from "../models/api/postModel";
import * as postRepo from "../repos/postRepo";
import { Post } from "../models/database/post";
import { CreatePostRequest } from "../models/api/createPostRequest";
import { createInteraction } from "../repos/interactionRepo";
import { parse } from "date-fns";
import { getByPostInteraction, getUser } from "../repos/userRepo";

export async function getPageOfPosts(
  page: number,
  pageSize: number
): Promise<Page<PostModel>> {
  const posts = await postRepo.getPosts(page, pageSize);
  const postsCount = await postRepo.countPosts();

  // This way of generating a list of post models is VERY inefficient
  // due to all the DB calls in the toPostModel function.
  // In total it will be (3N + 1) DB calls (where N is the number of items in page).
  // A better solution would be to do these joins in the SQL...
  // but that's quite a lot of effort without support from an ORM...
  // and we should get away with it for small local databases like ours.
  const postModels = await Promise.all(posts.map(toPostModel));

  return {
    results: postModels,
    next:
      page * pageSize < postsCount
        ? `/posts/?page=${page + 1}&pageSize=${pageSize}`
        : null,
    previous: page > 1 ? `/posts/?page=${page - 1}&pageSize=${pageSize}` : null,
    total: postsCount,
  };
}

export async function createPost(newPost: CreatePostRequest): Promise<void> {
  await postRepo.createPost(newPost);
}

export async function likePost(userId: number, postId: number): Promise<void> {
  return createInteraction(userId, postId, "LIKE");
}

export async function dislikePost(
  userId: number,
  postId: number
): Promise<void> {
  return createInteraction(userId, postId, "DISLIKE");
}

export async function getPost(postId: number): Promise<PostModel> {
  const post = await postRepo.getPost(postId);
  return toPostModel(post);
}

export async function deletePost(postId: number) {
    return postRepo.deletePost(postId);
}

async function toPostModel(post: Post): Promise<PostModel> {
  return {
    id: post.id,
    message: post.message,
    imageUrl: post.imageUrl,
    createdAt: parse(post.createdAt, "yyyy-MM-dd HH:mm:ss", new Date()),
    postedBy: await getUser(post.userId),
    likedBy: await getByPostInteraction(post.id, "LIKE", 1, 10),
    dislikedBy: await getByPostInteraction(post.id, "DISLIKE", 1, 10),
  };
}
