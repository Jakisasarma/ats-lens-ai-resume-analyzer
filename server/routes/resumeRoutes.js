import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  uploadResume,
  analyzeResume,
  getResumeHistory,
  getResumeAnalysis,
  deleteResumeAnalysis,
} from "../controllers/resumeController.js";

import protect from "../middleware/authMiddleware.js";

/* =========================================================
   ROUTER
========================================================= */

const router = express.Router();

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory =
  path.join(
    process.cwd(),
    "uploads"
  );

/* =========================================================
   CREATE UPLOAD DIRECTORY IF NOT EXISTS
========================================================= */

if (
  !fs.existsSync(
    uploadDirectory
  )
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

/* =========================================================
   MULTER STORAGE
========================================================= */

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(
          file.originalname
        );

      const safeName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
          );

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${safeName}${extension}`;

      cb(
        null,
        uniqueName
      );
    },
  });

/* =========================================================
   FILE FILTER
   PDF + DOCX ONLY
========================================================= */

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();

  const allowedExtensions = [
    ".pdf",
    ".docx",
  ];

  const validMimeType =
    allowedMimeTypes.includes(
      file.mimetype
    );

  const validExtension =
    allowedExtensions.includes(
      extension
    );

  if (
    validMimeType &&
    validExtension
  ) {
    cb(
      null,
      true
    );

    return;
  }

  cb(
    new Error(
      "Only PDF and DOCX resume files are allowed."
    )
  );
};

/* =========================================================
   MULTER CONFIG
   MAX FILE SIZE: 5 MB
========================================================= */

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });

/* =========================================================
   MULTER WRAPPER
========================================================= */

const uploadSingleResume = (
  req,
  res,
  next
) => {
  upload.single("resume")(
    req,
    res,
    (error) => {
      if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "Resume file must be 5 MB or smaller.",
            });
        }

        return res
          .status(400)
          .json({
            success: false,

            message:
              error.message ||
              "Resume upload failed.",
          });
      }

      if (error) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              error.message ||
              "Invalid resume file.",
          });
      }

      next();
    }
  );
};

/* =========================================================
   ROUTES
========================================================= */

/*
  IMPORTANT:

  protect runs FIRST.

  That means:
  1. JWT token checked
  2. req.user created
  3. Resume upload/controller runs
*/

/* ---------------------------------------------------------
   UPLOAD + EXTRACT ONLY
--------------------------------------------------------- */

router.post(
  "/upload",
  protect,
  uploadSingleResume,
  uploadResume
);

/* ---------------------------------------------------------
   FULL ATS AI ANALYSIS
--------------------------------------------------------- */

router.post(
  "/analyze",
  protect,
  uploadSingleResume,
  analyzeResume
);

/* ---------------------------------------------------------
   HISTORY

   IMPORTANT:
   /history must stay BEFORE /:id
--------------------------------------------------------- */

router.get(
  "/history",
  protect,
  getResumeHistory
);

/* ---------------------------------------------------------
   GET ONE ANALYSIS
--------------------------------------------------------- */

router.get(
  "/:id",
  protect,
  getResumeAnalysis
);

/* ---------------------------------------------------------
   DELETE ANALYSIS
--------------------------------------------------------- */

router.delete(
  "/:id",
  protect,
  deleteResumeAnalysis
);

/* =========================================================
   EXPORT
========================================================= */

export default router;