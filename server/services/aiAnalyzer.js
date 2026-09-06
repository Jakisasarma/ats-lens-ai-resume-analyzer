import "dotenv/config";

import OpenAI from "openai";

import {
  calculateDeterministicATSScore,
} from "./deterministicScoring.js";

/* =========================================================
   MODEL
========================================================= */

const MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-luna";

/* =========================================================
   OPENAI CLIENT

   IMPORTANT:
   Client is created only when needed.
   This prevents server startup from crashing
   if the API key has a configuration issue.
========================================================= */

const getOpenAIClient = () => {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (
    !apiKey ||
    !apiKey.trim()
  ) {
    throw new Error(
      "OPENAI_API_KEY is missing in server .env."
    );
  }

  return new OpenAI({
    apiKey:
      apiKey.trim(),
  });
};

/* =========================================================
   STRING CLEANER
========================================================= */

const cleanString = (
  value
) => {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
};

/* =========================================================
   ARRAY CLEANER
========================================================= */

const cleanArray = (
  value
) => {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (item) =>
            typeof item ===
            "string"
        )
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    ),
  ];
};

/* =========================================================
   CANDIDATE CLEANER
========================================================= */

const cleanCandidate = (
  candidate = {}
) => {
  return {
    name:
      cleanString(
        candidate.name
      ),

    email:
      cleanString(
        candidate.email
      ),

    phone:
      cleanString(
        candidate.phone
      ),

    location:
      cleanString(
        candidate.location
      ),

    linkedin:
      cleanString(
        candidate.linkedin
      ) || null,

    github:
      cleanString(
        candidate.github
      ) || null,

    portfolio:
      cleanString(
        candidate.portfolio
      ) || null,

    currentTitle:
      cleanString(
        candidate.currentTitle
      ),
  };
};

/* =========================================================
   JSON PARSER
========================================================= */

const parseAIJSON = (
  value
) => {
  if (
    !value ||
    !String(value).trim()
  ) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  let text =
    String(value).trim();

  /* Remove markdown fences if AI accidentally returns them */

  text =
    text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

  try {
    return JSON.parse(
      text
    );
  } catch (error) {
    console.error(
      "❌ AI JSON parse failed"
    );

    console.error(
      text
    );

    throw new Error(
      "AI returned invalid JSON."
    );
  }
};

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
You are ATS Lens, a professional AI resume analysis assistant.

Follow these rules exactly:

1. Analyze only information supported by the provided resume.
2. Never invent:
   - names
   - email addresses
   - phone numbers
   - locations
   - skills
   - jobs
   - employers
   - dates
   - education
   - certificates
   - achievements
   - portfolio URLs
   - LinkedIn URLs
   - GitHub URLs

3. If information is unavailable:
   - use an empty string
   - use null
   - or use an empty array

4. Review the complete resume.

5. The Job Description is optional.

6. If NO Job Description is supplied:
   - do not perform job-specific matching
   - skills.matched must be []
   - skills.missing must be []
   - skills.partial must be []

7. If a Job Description IS supplied:
   - matched skills must be clearly supported by both the resume and JD
   - missing skills must be requested by the JD but unsupported by the resume
   - partial skills must represent related but incomplete matches

8. Do NOT calculate an ATS score.

9. Do NOT calculate category scores.

10. Do NOT assign an ATS rating.

11. The backend calculates all ATS scores using deterministic rules.

12. Strengths, weaknesses, risks, and recommendations must be evidence-based.

13. Do not claim that an ATS system guarantees employment.

14. Return valid JSON only.

15. Do not use markdown code fences.

Return exactly this JSON structure:

{
  "candidate": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": null,
    "github": null,
    "portfolio": null,
    "currentTitle": ""
  },

  "summary": "",

  "skills": {
    "detected": [],
    "matched": [],
    "missing": [],
    "partial": []
  },

  "sections": {
    "summary": false,
    "experience": false,
    "education": false,
    "skills": false,
    "projects": false,
    "certifications": false,
    "achievements": false
  },

  "atsRisks": [],

  "strengths": [],

  "weaknesses": [],

  "recommendations": [],

  "finalVerdict": ""
}
`;

/* =========================================================
   USER PROMPT
========================================================= */

const buildUserPrompt = ({
  resumeText,
  jobDescription,
}) => {
  const hasJD =
    Boolean(
      jobDescription &&
      jobDescription.trim()
    );

  return `
==============================
RESUME
==============================

${resumeText}

==============================
JOB DESCRIPTION
==============================

${
  hasJD
    ? jobDescription
    : "NO JOB DESCRIPTION PROVIDED"
}

==============================

Analyze the resume carefully.

Important:

- Do not calculate ATS score.
- Do not calculate category scores.
- Do not invent information.
- Use only evidence from the resume.

${
  hasJD
    ? "Compare the resume with the supplied Job Description."
    : "This is resume-only analysis. Do not perform job-specific matching."
}
`;
};

/* =========================================================
   OPENAI ANALYSIS
========================================================= */

const getAIAnalysis =
  async ({
    resumeText,
    jobDescription,
  }) => {
    const openai =
      getOpenAIClient();

    console.log(
      `🤖 Using OpenAI model: ${MODEL}`
    );

    const response =
      await openai.responses.create({
        model:
          MODEL,

        instructions:
          SYSTEM_PROMPT,

        input:
          buildUserPrompt({
            resumeText,
            jobDescription,
          }),
      });

    const outputText =
      response.output_text;

    if (
      !outputText ||
      !outputText.trim()
    ) {
      throw new Error(
        "OpenAI returned no text."
      );
    }

    return parseAIJSON(
      outputText
    );
  };

/* =========================================================
   MAIN ANALYZER
========================================================= */

export const analyzeResumeWithAI =
  async ({
    resumeText,
    jobDescription = "",
  }) => {
    /* =====================================================
       VALIDATE RESUME
    ====================================================== */

    if (
      !resumeText ||
      !resumeText.trim()
    ) {
      throw new Error(
        "Resume text is empty."
      );
    }

    const cleanResume =
      resumeText.trim();

    const cleanJD =
      typeof jobDescription ===
        "string"
        ? jobDescription.trim()
        : "";

    const hasJD =
      Boolean(cleanJD);

    /* =====================================================
       STEP 1 — DETERMINISTIC SCORE
    ====================================================== */

    const deterministic =
      calculateDeterministicATSScore({
        resumeText:
          cleanResume,

        jobDescription:
          cleanJD,
      });

    console.log(
      `✅ Deterministic ATS score: ${deterministic.score}/100`
    );

    console.log(
      `✅ ATS rating: ${deterministic.rating}`
    );

    console.log(
      `✅ Analysis mode: ${deterministic.meta.mode}`
    );

    /* =====================================================
       STEP 2 — AI ANALYSIS
    ====================================================== */

    const ai =
      await getAIAnalysis({
        resumeText:
          cleanResume,

        jobDescription:
          cleanJD,
      });

    console.log(
      "✅ AI content analysis received"
    );

    /* =====================================================
       STEP 3 — CANDIDATE
    ====================================================== */

    const candidate =
      cleanCandidate(
        ai?.candidate ||
        {}
      );

    /* =====================================================
       STEP 4 — SKILLS
    ====================================================== */

    const detectedSkills =
      cleanArray(
        ai?.skills?.detected
      );

    let matchedSkills =
      cleanArray(
        ai?.skills?.matched
      );

    let missingSkills =
      cleanArray(
        ai?.skills?.missing
      );

    let partialSkills =
      cleanArray(
        ai?.skills?.partial
      );

    /* JD absent => comparison arrays must remain empty */

    if (!hasJD) {
      matchedSkills = [];
      missingSkills = [];
      partialSkills = [];
    }

    /* =====================================================
       STEP 5 — SUMMARY
    ====================================================== */

    const aiSummary =
      cleanString(
        ai?.summary
      );

    let summary;

    if (hasJD) {
      summary =
        aiSummary ||
        `The resume received an ATS compatibility score of ${deterministic.score}/100 and is rated ${deterministic.rating}. The score was calculated using deterministic resume and job-description analysis.`;
    } else {
      summary =
        aiSummary ||
        `The resume received an ATS compatibility score of ${deterministic.score}/100 and is rated ${deterministic.rating}. No Job Description was provided, so job-specific matching was not performed.`;
    }

    /* =====================================================
       STEP 6 — FINAL RESULT

       IMPORTANT:
       AI never controls the ATS score.
    ====================================================== */

    const result = {
      candidate,

      ats: {
        score:
          deterministic.score,

        rating:
          deterministic.rating,

        summary,
      },

      scores:
        deterministic.scores,

      skills: {
        detected:
          detectedSkills,

        matched:
          matchedSkills,

        missing:
          missingSkills,

        partial:
          partialSkills,
      },

      sections: {
        summary:
          Boolean(
            ai?.sections?.summary
          ),

        experience:
          Boolean(
            ai?.sections
              ?.experience
          ),

        education:
          Boolean(
            ai?.sections
              ?.education
          ),

        skills:
          Boolean(
            ai?.sections?.skills
          ),

        projects:
          Boolean(
            ai?.sections
              ?.projects
          ),

        certifications:
          Boolean(
            ai?.sections
              ?.certifications
          ),

        achievements:
          Boolean(
            ai?.sections
              ?.achievements
          ),
      },

      atsRisks:
        cleanArray(
          ai?.atsRisks
        ),

      strengths:
        cleanArray(
          ai?.strengths
        ),

      weaknesses:
        cleanArray(
          ai?.weaknesses
        ),

      recommendations:
        cleanArray(
          ai?.recommendations
        ),

      finalVerdict:
        cleanString(
          ai?.finalVerdict
        ),

      scoringMeta: {
        deterministic:
          true,

        mode:
          deterministic.meta.mode,

        wordCount:
          deterministic.meta.wordCount,

        detectedSkillCount:
          deterministic.meta
            .detectedSkillCount,
      },
    };

    console.log(
      "✅ AI resume analysis completed"
    );

    console.log(
      `✅ Final fixed ATS score: ${result.ats.score}/100`
    );

    return result;
  };

export default analyzeResumeWithAI;