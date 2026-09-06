import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================================================
   AUTH MIDDLEWARE
   Verify JWT token and attach logged-in user to req.user
========================================================= */

export const protect = async (
  req,
  res,
  next
) => {
  try {
    /* -----------------------------------------------------
       GET AUTHORIZATION HEADER
    ----------------------------------------------------- */

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required. Please sign in.",
      });
    }

    /* -----------------------------------------------------
       EXTRACT TOKEN
    ----------------------------------------------------- */

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing.",
      });
    }

    /* -----------------------------------------------------
       JWT SECRET
    ----------------------------------------------------- */

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_SECRET is missing from server .env"
      );
    }

    /* -----------------------------------------------------
       VERIFY TOKEN
    ----------------------------------------------------- */

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        secret
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token.",
      });
    }

    /* -----------------------------------------------------
       CHECK USER ID
    ----------------------------------------------------- */

    if (
      !decoded ||
      !decoded.userId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    /* -----------------------------------------------------
       FIND USER
    ----------------------------------------------------- */

    const user =
      await User.findById(
        decoded.userId
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account was not found.",
      });
    }

    /* -----------------------------------------------------
       ACCOUNT ACTIVE CHECK
    ----------------------------------------------------- */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account is disabled.",
      });
    }

    /* -----------------------------------------------------
       ATTACH USER TO REQUEST
    ----------------------------------------------------- */

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default protect;