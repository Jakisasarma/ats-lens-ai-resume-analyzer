import mongoose from "mongoose";

/* =========================================================
   SCORE ITEM
========================================================= */

const scoreItemSchema =
  new mongoose.Schema(
    {
      score: {
        type: Number,
        default: 0,
      },

      max: {
        type: Number,
        default: 0,
      },

      percentage: {
        type: Number,
        default: 0,
      },

      explanation: {
        type: String,
        default: "",
      },

      evidence: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   CANDIDATE
========================================================= */

const candidateSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      location: {
        type: String,
        default: "",
      },

      linkedin: {
        type: String,
        default: "",
      },

      github: {
        type: String,
        default: "",
      },

      portfolio: {
        type: String,
        default: "",
      },

      currentTitle: {
        type: String,
        default: "",
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   DOCUMENT
========================================================= */

const documentSchema =
  new mongoose.Schema(
    {
      pageCount: {
        type: Number,
        default: 0,
      },

      wordCount: {
        type: Number,
        default: 0,
      },

      parsingConfidence: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   ATS
========================================================= */

const atsSchema =
  new mongoose.Schema(
    {
      score: {
        type: Number,
        default: 0,
      },

      rating: {
        type: String,
        default: "Not Rated",
      },

      summary: {
        type: String,
        default: "",
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   SKILLS
========================================================= */

const skillsSchema =
  new mongoose.Schema(
    {
      detected: {
        type: [String],
        default: [],
      },

      matched: {
        type: [String],
        default: [],
      },

      missing: {
        type: [String],
        default: [],
      },

      partial: {
        type: [String],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   SECTIONS
========================================================= */

const sectionsSchema =
  new mongoose.Schema(
    {
      summary: {
        type: Boolean,
        default: false,
      },

      experience: {
        type: Boolean,
        default: false,
      },

      education: {
        type: Boolean,
        default: false,
      },

      skills: {
        type: Boolean,
        default: false,
      },

      projects: {
        type: Boolean,
        default: false,
      },

      certifications: {
        type: Boolean,
        default: false,
      },

      achievements: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   SCORES
========================================================= */

const scoresSchema =
  new mongoose.Schema(
    {
      keywordSkillMatch: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      jobRelevance: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      atsStructure: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      relevantExperience: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      educationCertifications: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      achievementsImpact: {
        type: scoreItemSchema,
        default: () => ({}),
      },

      formattingReadability: {
        type: scoreItemSchema,
        default: () => ({}),
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   RESUME ANALYSIS
========================================================= */

const resumeAnalysisSchema =
  new mongoose.Schema(
    {
      /* -----------------------------------------------------
         USER OWNERSHIP
      ----------------------------------------------------- */

      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      /* -----------------------------------------------------
         FILE
      ----------------------------------------------------- */

      fileName: {
        type: String,

        required: true,

        trim: true,
      },

      fileType: {
        type: String,

        default: "",
      },

      extractedText: {
        type: String,

        default: "",
      },

      jobDescription: {
        type: String,

        default: "",
      },

      /* -----------------------------------------------------
         CANDIDATE
      ----------------------------------------------------- */

      candidate: {
        type:
          candidateSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         DOCUMENT
      ----------------------------------------------------- */

      document: {
        type:
          documentSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         ATS
      ----------------------------------------------------- */

      ats: {
        type:
          atsSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         SCORE BREAKDOWN
      ----------------------------------------------------- */

      scores: {
        type:
          scoresSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         SKILLS
      ----------------------------------------------------- */

      skills: {
        type:
          skillsSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         SECTIONS
      ----------------------------------------------------- */

      sections: {
        type:
          sectionsSchema,

        default:
          () => ({}),
      },

      /* -----------------------------------------------------
         INSIGHTS
      ----------------------------------------------------- */

      atsRisks: {
        type: [String],

        default: [],
      },

      strengths: {
        type: [String],

        default: [],
      },

      weaknesses: {
        type: [String],

        default: [],
      },

      recommendations: {
        type: [String],

        default: [],
      },

      finalVerdict: {
        type: String,

        default: "",
      },

      parsingConfidence: {
        type: Number,

        default: 0,
      },

      /* -----------------------------------------------------
         STATUS
      ----------------------------------------------------- */

      status: {
        type: String,

        enum: [
          "uploaded",
          "extracted",
          "analyzed",
          "failed",
        ],

        default:
          "uploaded",
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   INDEX
========================================================= */

resumeAnalysisSchema.index({
  user: 1,

  createdAt: -1,
});

/* =========================================================
   MODEL
========================================================= */

const ResumeAnalysis =
  mongoose.models
    .ResumeAnalysis ||
  mongoose.model(
    "ResumeAnalysis",
    resumeAnalysisSchema
  );

export default ResumeAnalysis;