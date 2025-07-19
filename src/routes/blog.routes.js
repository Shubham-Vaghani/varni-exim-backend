import { Router } from "express";
import {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getUserBlogs,
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getBlogs);
router.route("/:id").get(getBlog);

// Protected routes
router.route("/").post(verifyJWT, createBlog);
router.route("/:id").put(verifyJWT, updateBlog);
router.route("/:id").delete(verifyJWT, deleteBlog);
router.route("/user/my-blogs").get(verifyJWT, getUserBlogs);

export default router;
