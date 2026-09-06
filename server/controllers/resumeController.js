import fs from "fs/promises";
import mongoose from "mongoose";

import ResumeAnalysis from "../models/ResumeAnalysis.js";

import {
  extractResumeText,
} from "../services/extractText.js";

import {
  analyzeResumeWithAI,
} from "../services/aiAnalyzer.js";

/* =========================================================
   DELETE TEMP FILE
========================================================= */

const deleteTempFile = async (
  filePath
) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(
      "Temporary file delete failed:",
      error.message
    );
  }
};

/* =========================================================
   CHECK LOGGED-IN USER
========================================================= */

const getLoggedInUserId = (req) => {
  const userId =
    req.user?._id ||
    req.user?.id;

  if (!userId) {
    const error = new Error(
      "Authentication required. Please sign in."
    );

    error.statusCode = 401;

    throw error;
  }

  return userId;
};

/* =========================================================
   UPLOAD / EXTRACTION ONLY
========================================================= */

export const uploadResume =
  async (req, res, next) => {
    let filePath = null;

    try {
      const userId =
        getLoggedInUserId(req);

      if (!req.file) {
        res.status(400);

        throw new Error(
          "Please upload a PDF or DOCX resume."
        );
      }

      filePath =
        req.file.path;

      const jobDescription =
        req.body?.jobDescription
          ?.trim() || "";

      const extracted =
        await extractResumeText(
          req.file
        );

      const resumeText =
        extracted?.text ||
        extracted?.extractedText ||
        "";

      if (!resumeText.trim()) {
        res.status(400);

        throw new Error(
          "No readable text was found in the resume."
        );
      }

      const resume =
        new ResumeAnalysis({
          /* ===============================================
             USER OWNERSHIP
          =============================================== */

          user: userId,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          extractedText:
            resumeText,

          jobDescription,

          document: {
            pageCount:
              extracted?.pageCount ??
              null,

            wordCount:
              extracted?.wordCount ??
              resumeText
                .split(/\s+/)
                .filter(Boolean)
                .length,

            parsingConfidence:
              extracted
                ?.parsingConfidence ??
              95,
          },

          status:
            "extracted",
        });

      const savedResume =
        await resume.save();

      res.status(201).json({
        success: true,

        message:
          "Resume uploaded and extracted successfully.",

        analysis: {
          id:
            savedResume._id.toString(),

          _id:
            savedResume._id.toString(),

          fileName:
            savedResume.fileName,

          fileType:
            savedResume.fileType,

          jobDescription:
            savedResume.jobDescription,

          document:
            savedResume.document,

          status:
            savedResume.status,

          createdAt:
            savedResume.createdAt,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      await deleteTempFile(
        filePath
      );
    }
  };

/* =========================================================
   FULL AI ANALYSIS
========================================================= */

export const analyzeResume =
  async (req, res, next) => {
    let filePath = null;

    try {
      const userId =
        getLoggedInUserId(req);

      if (!req.file) {
        res.status(400);

        throw new Error(
          "Please upload a PDF or DOCX resume."
        );
      }

      filePath =
        req.file.path;

      const jobDescription =
        req.body?.jobDescription
          ?.trim() || "";

      /* =====================================================
         STEP 1 — EXTRACT TEXT
      ====================================================== */

      const extracted =
        await extractResumeText(
          req.file
        );

      const resumeText =
        extracted?.text ||
        extracted?.extractedText ||
        "";

      if (!resumeText.trim()) {
        res.status(400);

        throw new Error(
          "Resume text is empty."
        );
      }

      console.log(
        `✅ Resume text ready: ${
          extracted?.wordCount ??
          resumeText
            .split(/\s+/)
            .filter(Boolean)
            .length
        } words`
      );

      /* =====================================================
         STEP 2 — AI ANALYSIS

         IMPORTANT:
         aiAnalyzer expects ONE OBJECT
      ====================================================== */

      const aiResult =
        await analyzeResumeWithAI({
          resumeText,
          jobDescription,
        });

      if (!aiResult) {
        res.status(500);

        throw new Error(
          "AI analysis did not return a result."
        );
      }

      console.log(
        "✅ AI analysis completed"
      );

      /* =====================================================
         STEP 3 — CREATE DATABASE RECORD
      ====================================================== */

      const analysis =
        new ResumeAnalysis({
          /* ===============================================
             USER OWNERSHIP
          =============================================== */

          user: userId,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          extractedText:
            resumeText,

          jobDescription,

          document: {
            pageCount:
              extracted?.pageCount ??
              null,

            wordCount:
              extracted?.wordCount ??
              resumeText
                .split(/\s+/)
                .filter(Boolean)
                .length,

            parsingConfidence:
              extracted
                ?.parsingConfidence ??
              95,
          },

          candidate:
            aiResult.candidate || {},

          ats:
            aiResult.ats || {
              score: 0,
              rating: "",
              summary: "",
            },

          scores:
            aiResult.scores || {},

          skills:
            aiResult.skills || {
              detected: [],
              matched: [],
              missing: [],
              partial: [],
            },

          sections:
            aiResult.sections || {},

          atsRisks:
            aiResult.atsRisks ||
            [],

          strengths:
            aiResult.strengths ||
            [],

          weaknesses:
            aiResult.weaknesses ||
            [],

          recommendations:
            aiResult.recommendations ||
            [],

          finalVerdict:
            aiResult.finalVerdict ||
            "",

          status:
            "analyzed",
        });

      /* =====================================================
         STEP 4 — SAVE TO MONGODB
      ====================================================== */

      const savedAnalysis =
        await analysis.save();

      console.log(
        "✅ Analysis saved to MongoDB"
      );

      const resultId =
        savedAnalysis._id.toString();

      /* =====================================================
         STEP 5 — RETURN FULL RESULT + ID
      ====================================================== */

      res.status(201).json({
        success: true,

        message:
          "Resume analyzed successfully.",

        analysis: {
          id:
            resultId,

          _id:
            resultId,

          fileName:
            savedAnalysis.fileName,

          fileType:
            savedAnalysis.fileType,

          jobDescription:
            savedAnalysis.jobDescription,

          document:
            savedAnalysis.document,

          candidate:
            savedAnalysis.candidate,

          ats:
            savedAnalysis.ats,

          scores:
            savedAnalysis.scores,

          skills:
            savedAnalysis.skills,

          sections:
            savedAnalysis.sections,

          atsRisks:
            savedAnalysis.atsRisks,

          strengths:
            savedAnalysis.strengths,

          weaknesses:
            savedAnalysis.weaknesses,

          recommendations:
            savedAnalysis
              .recommendations,

          finalVerdict:
            savedAnalysis
              .finalVerdict,

          status:
            savedAnalysis.status,

          createdAt:
            savedAnalysis.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Analyze resume error:",
        error
      );

      next(error);
    } finally {
      await deleteTempFile(
        filePath
      );
    }
  };

/* =========================================================
   GET HISTORY
   ONLY LOGGED-IN USER
========================================================= */

export const getResumeHistory =
  async (req, res, next) => {
    try {
      const userId =
        getLoggedInUserId(req);

      if (
        mongoose.connection
          .readyState !== 1
      ) {
        return res.status(503).json({
          success: false,

          message:
            "Database is not connected.",

          analyses: [],
        });
      }

      const analyses =
        await ResumeAnalysis.find({
          user: userId,
        })
          .sort({
            createdAt: -1,
          })
          .select(
            [
              "candidate",
              "ats",
              "fileName",
              "fileType",
              "status",
              "createdAt",
            ].join(" ")
          )
          .lean();

      res.status(200).json({
        success: true,

        count:
          analyses.length,

        analyses,
      });
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   GET ONE ANALYSIS
   ONLY OWNER CAN OPEN
========================================================= */

export const getResumeAnalysis =
  async (req, res, next) => {
    try {
      const userId =
        getLoggedInUserId(req);

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Resume analysis not found.",
        });
      }

      const analysis =
        await ResumeAnalysis.findOne({
          _id:
            req.params.id,

          user:
            userId,
        }).lean();

      if (!analysis) {
        return res.status(404).json({
          success: false,

          message:
            "Resume analysis not found.",
        });
      }

      res.status(200).json({
        success: true,

        analysis,
      });
    } catch (error) {
      next(error);
    }
  };

/* =========================================================
   DELETE ANALYSIS
   ONLY OWNER CAN DELETE
========================================================= */

export const deleteResumeAnalysis =
  async (req, res, next) => {
    try {
      const userId =
        getLoggedInUserId(req);

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Resume analysis not found.",
        });
      }

      const analysis =
        await ResumeAnalysis.findOne({
          _id:
            req.params.id,

          user:
            userId,
        });

      if (!analysis) {
        return res.status(404).json({
          success: false,

          message:
            "Resume analysis not found.",
        });
      }

      await analysis.deleteOne();

      res.status(200).json({
        success: true,

        message:
          "Resume analysis deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };