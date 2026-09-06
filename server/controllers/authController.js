import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";

/* =========================================================
   GOOGLE CLIENT
========================================================= */

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

/* =========================================================
   CREATE JWT TOKEN
========================================================= */

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/* =========================================================
   FORMAT USER RESPONSE
========================================================= */

const formatUser = (user) => {
  return {
    id: user._id,
    _id: user._id,

    name: user.name,
    email: user.email,

    avatar:
      user.avatar || null,

    authProvider:
      user.authProvider,

    isActive:
      user.isActive,
  };
};

/* =========================================================
   CREATE DISPLAY NAME FROM EMAIL
========================================================= */

const createDisplayName = (
  email
) => {
  const emailPrefix =
    email
      .split("@")[0]
      .trim();

  if (!emailPrefix) {
    return "ATS Lens User";
  }

  const cleaned =
    emailPrefix
      .replace(
        /[^a-zA-Z0-9._-]/g,
        ""
      )
      .replace(
        /[._-]+/g,
        " "
      )
      .trim();

  if (!cleaned) {
    return "ATS Lens User";
  }

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
    .slice(0, 80);
};

/* =========================================================
   REGISTER
========================================================= */

export const register = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const normalizedPassword =
      String(password);

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (
      normalizedPassword.length <
      6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* -----------------------------------------------------
       CHECK EXISTING USER
    ----------------------------------------------------- */

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    /* -----------------------------------------------------
       HASH PASSWORD
    ----------------------------------------------------- */

    const hashedPassword =
      await bcrypt.hash(
        normalizedPassword,
        12
      );

    /* -----------------------------------------------------
       CREATE USER
    ----------------------------------------------------- */

    const user =
      await User.create({
        name:
          createDisplayName(
            normalizedEmail
          ),

        email:
          normalizedEmail,

        password:
          hashedPassword,

        authProvider:
          "local",

        googleId:
          null,

        avatar:
          null,

        isActive:
          true,
      });

    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token =
      createToken(
        user._id
      );

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully.",

      token,

      user:
        formatUser(user),
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create account.",
    });
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    /* -----------------------------------------------------
       FIND USER
       Password has select:false in model,
       so explicitly include it.
    ----------------------------------------------------- */

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /* -----------------------------------------------------
       ACTIVE CHECK
    ----------------------------------------------------- */

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account is inactive.",
      });
    }

    /* -----------------------------------------------------
       GOOGLE-ONLY ACCOUNT CHECK
    ----------------------------------------------------- */

    if (
      user.authProvider ===
        "google" &&
      !user.password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    /* -----------------------------------------------------
       PASSWORD CHECK
    ----------------------------------------------------- */

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        String(password),
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token =
      createToken(
        user._id
      );

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        formatUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to sign in.",
    });
  }
};

/* =========================================================
   GOOGLE LOGIN
========================================================= */

export const googleLogin =
  async (
    req,
    res
  ) => {
    try {
      const {
        credential,
      } = req.body;

      /* ---------------------------------------------------
         VALIDATION
      --------------------------------------------------- */

      if (!credential) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Google credential is required.",
          });
      }

      if (
        !process.env
          .GOOGLE_CLIENT_ID
      ) {
        console.error(
          "GOOGLE_CLIENT_ID is missing."
        );

        return res
          .status(500)
          .json({
            success: false,
            message:
              "Google Sign-In is not configured on the server.",
          });
      }

      /* ---------------------------------------------------
         VERIFY GOOGLE TOKEN
      --------------------------------------------------- */

      const ticket =
        await googleClient.verifyIdToken(
          {
            idToken:
              credential,

            audience:
              process.env
                .GOOGLE_CLIENT_ID,
          }
        );

      const payload =
        ticket.getPayload();

      if (!payload) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unable to verify Google account.",
          });
      }

      /* ---------------------------------------------------
         GOOGLE USER DATA
      --------------------------------------------------- */

      const googleId =
        payload.sub;

      const email =
        payload.email
          ?.trim()
          .toLowerCase();

      const googleName =
        payload.name
          ?.trim();

      const avatar =
        payload.picture ||
        null;

      const emailVerified =
        payload.email_verified;

      /* ---------------------------------------------------
         GOOGLE VALIDATION
      --------------------------------------------------- */

      if (
        !googleId ||
        !email
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Google account information is incomplete.",
          });
      }

      if (
        emailVerified ===
        false
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Google email is not verified.",
          });
      }

      /* ---------------------------------------------------
         FIND EXISTING USER
      --------------------------------------------------- */

      let user =
        await User.findOne({
          $or: [
            {
              googleId,
            },
            {
              email,
            },
          ],
        });

      /* ---------------------------------------------------
         CREATE NEW GOOGLE USER
      --------------------------------------------------- */

      if (!user) {
        user =
          await User.create({
            name:
              googleName ||
              createDisplayName(
                email
              ),

            email,

            authProvider:
              "google",

            googleId,

            avatar,

            isActive:
              true,
          });
      } else {
        /* -------------------------------------------------
           EXISTING USER
        ------------------------------------------------- */

        if (!user.isActive) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                "This account is inactive.",
            });
        }

        /*
          If a normal email/password user uses Google
          with the same verified email, we keep the local
          login working and link the Google ID to the
          same ATS Lens account.
        */

        if (
          !user.googleId
        ) {
          user.googleId =
            googleId;
        }

        if (
          !user.avatar &&
          avatar
        ) {
          user.avatar =
            avatar;
        }

        if (
          (!user.name ||
            user.name.trim()
              .length < 2) &&
          googleName
        ) {
          user.name =
            googleName;
        }

        await user.save();
      }

      /* ---------------------------------------------------
         JWT
      --------------------------------------------------- */

      const token =
        createToken(
          user._id
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Google login successful.",

          token,

          user:
            formatUser(user),
        });
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Google Sign-In failed. Please try again.",
        });
    }
  };