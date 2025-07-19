import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";

// Get all blogs
const getBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const query = {};

  // Add search functionality
  if (search) {
    query.$text = { $search: search };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === "desc" ? -1 : 1 },
    populate: {
      path: "author",
      select: "userId email",
    },
  };

  const blogs = await Blog.find(query)
    .populate("author", "userId email")
    .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Blog.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Blogs fetched successfully"
    )
  );
});

// Get single blog
const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate("author", "userId email");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog fetched successfully"));
});

// Create new blog
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, tags, status } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  const blog = await Blog.create({
    title,
    content,
    author: req.user._id,
    tags: tags || [],
    status: status || "published",
  });

  const createdBlog = await Blog.findById(blog._id).populate(
    "author",
    "userId email"
  );

  if (!createdBlog) {
    throw new ApiError(500, "Something went wrong while creating the blog");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdBlog, "Blog created successfully"));
});

// Update blog
const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, tags, status } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  // Check if user is the author of the blog
  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own blogs");
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    id,
    {
      $set: {
        title: title || blog.title,
        content: content || blog.content,
        tags: tags || blog.tags,
        status: status || blog.status,
      },
    },
    { new: true }
  ).populate("author", "userId email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
});

// Delete blog
const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  // Check if user is the author of the blog
  if (blog.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own blogs");
  }

  await Blog.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Blog deleted successfully"));
});

// Get user's blogs
const getUserBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const blogs = await Blog.find({ author: req.user._id })
    .populate("author", "userId email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Blog.countDocuments({ author: req.user._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "User blogs fetched successfully"
    )
  );
});

export { getBlogs, getBlog, createBlog, updateBlog, deleteBlog, getUserBlogs };
