import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    try {
      // Try to verify the access token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -pin"
      );

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (tokenError) {
      // If access token is expired, try to refresh it
      if (tokenError.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
          throw new ApiError(401, "Access token expired and no refresh token provided");
        }

        try {
          const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
          
          const user = await User.findById(decodedRefreshToken?._id);
          
          if (!user || refreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
          }

          // Generate new tokens
          const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

          const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          };

          // Set new tokens in cookies
          res.cookie("accessToken", accessToken, options);
          res.cookie("refreshToken", newRefreshToken, {
            ...options,
            maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
          });

          // Set user for the request
          req.user = await User.findById(user._id).select("-password -refreshToken -pin");
          req.tokenRefreshed = true; // Flag to indicate token was refreshed
          
          next();
        } catch (refreshError) {
          throw new ApiError(401, "Invalid refresh token");
        }
      } else {
        throw new ApiError(401, tokenError?.message || "Invalid access token");
      }
    }
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

// Optional: Middleware to add refresh info to response headers
export const addTokenRefreshHeaders = (req, res, next) => {
  res.on('finish', () => {
    if (req.tokenRefreshed) {
      res.setHeader('X-Token-Refreshed', 'true');
    }
  });
  next();
};
