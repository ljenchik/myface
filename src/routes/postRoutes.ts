import express from "express";
import { CreatePostRequest } from "../models/api/createPostRequest";
import {
  createPost,
  dislikePost,
  getPageOfPosts,
  likePost,
  getPost,
  deletePost
} from "../services/postService";
import { body, validationResult } from "express-validator";
import { format } from "date-fns";
import { getUserByPostId } from "../repos/userRepo";

const router = express.Router();

router.get("/", async (request, response) => {
  const page = request.query.page ? parseInt(request.query.page as string) : 1;
  const pageSize = request.query.pageSize
    ? parseInt(request.query.pageSize as string)
    : 10;

  const postList = await getPageOfPosts(page, pageSize);
  return response.render("post_list", {
    postList: postList,
    format: format,
    previous: postList.previous,
    next: postList.next
  });
});

router.get("/create/", async (request, response) => {
  return response.render("create_post");
});

router.post(
  "/create/",
  body("message").notEmpty(),
  body("imageUrl").notEmpty(),
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    const post = request.body;

    await createPost(post as CreatePostRequest);
    return response.redirect("/posts/");
  }
);

router.post("/:postId/like/", async (request, response) => {
  const userId = 1; // For now, just assume that we are user 1
  const postId = parseInt(request.params.postId);
  const returnUrl = request.params?.returnUrl;

  await likePost(userId, postId);
  response.redirect(returnUrl || "/posts/");
});

router.post("/:postId/dislike/", async (request, response) => {
  const userId = 1; // For now, just assume that we are user 1
  const postId = parseInt(request.params.postId);
  const returnUrl = request.params?.returnUrl;

  await dislikePost(userId, postId);
  response.redirect(returnUrl || "/posts/");
});

router.get("/:postId/", async (request, response) => {
  const postId = parseInt(request.params.postId);
  const post = await getPost(postId);
  return response.render("post_detail", post);
});

router.post("/:postId/delete/", async (request, response) => {
  const postId = parseInt(request.params.postId);
  const user = await getUserByPostId(postId);
  await deletePost(postId);
  return response.redirect(`/users/${(user).id}`);
});

export default router;
