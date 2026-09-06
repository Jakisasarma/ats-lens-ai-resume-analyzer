/* =========================================================
   ATS LENS — DETERMINISTIC ATS SCORING ENGINE

   IMPORTANT:
   Same resume + same JD = same score.

   AI does NOT decide the final ATS score.
   This file calculates scores using fixed rules.
========================================================= */

/* =========================================================
   BASIC HELPERS
========================================================= */

const clamp = (
  value,
  min,
  max
) => {
  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );
};

const normalizeText = (
  value = ""
) => {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#./\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const countWords = (
  text = ""
) => {
  const normalized =
    normalizeText(text);

  if (!normalized) {
    return 0;
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .length;
};

const roundScore = (
  value
) => {
  return Math.round(
    Number(value) || 0
  );
};

/* =========================================================
   STOP WORDS
========================================================= */

const STOP_WORDS =
  new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "been",
    "being",
    "but",
    "by",
    "can",
    "could",
    "do",
    "does",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "here",
    "him",
    "his",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "may",
    "more",
    "must",
    "not",
    "of",
    "on",
    "or",
    "our",
    "should",
    "so",
    "such",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "will",
    "with",
    "you",
    "your",
    "job",
    "role",
    "work",
    "working",
    "candidate",
    "required",
    "preferred",
    "responsibilities",
    "requirements",
    "experience",
    "years",
    "year",
  ]);

/* =========================================================
   PROFESSIONAL SKILL LEXICON

   This is only used for stable resume-only scoring.
   It does NOT invent skills in the result.
========================================================= */

const SKILL_TERMS = [
  /* Creative */
  "adobe premiere pro",
  "premiere pro",
  "after effects",
  "adobe after effects",
  "photoshop",
  "adobe photoshop",
  "illustrator",
  "adobe illustrator",
  "davinci resolve",
  "final cut pro",
  "figma",
  "canva",
  "video editing",
  "photo editing",
  "motion graphics",
  "graphic design",
  "color grading",
  "audio editing",
  "audio synchronization",
  "animation",
  "cinematography",
  "photography",
  "ui design",
  "ux design",

  /* Development */
  "html",
  "css",
  "javascript",
  "typescript",
  "react",
  "react.js",
  "node.js",
  "node",
  "express",
  "mongodb",
  "mysql",
  "postgresql",
  "python",
  "java",
  "c++",
  "c#",
  "php",
  "git",
  "github",
  "rest api",
  "api",
  "next.js",
  "vue",
  "angular",
  "tailwind css",
  "bootstrap",

  /* Business / Office */
  "microsoft office",
  "ms office",
  "excel",
  "word",
  "powerpoint",
  "project management",
  "data analysis",
  "seo",
  "digital marketing",
  "social media",
  "content creation",
  "content marketing",

  /* Soft skills */
  "communication",
  "leadership",
  "teamwork",
  "problem solving",
  "time management",
  "creativity",
  "client management",
  "client communication",
  "attention to detail",
];

/* =========================================================
   SECTION HEADINGS
========================================================= */

const SECTION_GROUPS = {
  summary: [
    "summary",
    "profile",
    "professional summary",
    "career objective",
    "objective",
    "about me",
  ],

  experience: [
    "experience",
    "work experience",
    "employment",
    "employment history",
    "professional experience",
    "work history",
  ],

  education: [
    "education",
    "academic background",
    "academic qualifications",
    "qualifications",
  ],

  skills: [
    "skills",
    "technical skills",
    "core skills",
    "competencies",
    "expertise",
  ],

  projects: [
    "projects",
    "project experience",
    "personal projects",
  ],

  certifications: [
    "certifications",
    "certificates",
    "licenses",
    "courses",
    "training",
  ],

  achievements: [
    "achievements",
    "awards",
    "accomplishments",
    "honors",
  ],
};

/* =========================================================
   DETECT SECTION
========================================================= */

const hasSection = (
  resumeText,
  names
) => {
  const text =
    resumeText.toLowerCase();

  return names.some(
    (name) => {
      const escaped =
        name.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex =
        new RegExp(
          `(^|\\n|\\r)\\s*${escaped}\\s*[:\\-]?\\s*(\\n|\\r|$)`,
          "i"
        );

      return (
        regex.test(
          resumeText
        ) ||
        text.includes(
          `${name}:`
        )
      );
    }
  );
};

/* =========================================================
   DETECT PROFESSIONAL SKILLS
========================================================= */

const detectStableSkills = (
  resumeText
) => {
  const text =
    normalizeText(
      resumeText
    );

  const detected = [];

  for (
    const skill of
    SKILL_TERMS
  ) {
    const normalizedSkill =
      normalizeText(skill);

    if (
      text.includes(
        normalizedSkill
      )
    ) {
      detected.push(
        skill
      );
    }
  }

  return [
    ...new Set(
      detected
    ),
  ];
};

/* =========================================================
   JD KEYWORDS
========================================================= */

const extractJDKeywords = (
  jobDescription
) => {
  const normalized =
    normalizeText(
      jobDescription
    );

  if (!normalized) {
    return [];
  }

  const words =
    normalized
      .split(/\s+/)
      .filter(
        (word) =>
          word.length >= 3 &&
          !STOP_WORDS.has(
            word
          ) &&
          !/^\d+$/.test(
            word
          )
      );

  const frequency =
    new Map();

  for (
    const word of words
  ) {
    frequency.set(
      word,
      (
        frequency.get(
          word
        ) || 0
      ) + 1
    );
  }

  const keywords =
    [...frequency.entries()]
      .sort(
        (a, b) => {
          if (
            b[1] !== a[1]
          ) {
            return (
              b[1] -
              a[1]
            );
          }

          return a[0]
            .localeCompare(
              b[0]
            );
        }
      )
      .map(
        ([word]) =>
          word
      );

  return keywords.slice(
    0,
    40
  );
};

/* =========================================================
   MATCH JD KEYWORDS
========================================================= */

const getKeywordMatch = (
  resumeText,
  jobDescription
) => {
  const resume =
    normalizeText(
      resumeText
    );

  const keywords =
    extractJDKeywords(
      jobDescription
    );

  if (
    keywords.length === 0
  ) {
    return {
      keywords: [],
      matched: [],
      missing: [],
      percentage: 0,
    };
  }

  const matched =
    keywords.filter(
      (keyword) =>
        resume.includes(
          keyword
        )
    );

  const missing =
    keywords.filter(
      (keyword) =>
        !resume.includes(
          keyword
        )
    );

  const percentage =
    Math.round(
      (
        matched.length /
        keywords.length
      ) *
        100
    );

  return {
    keywords,
    matched,
    missing,
    percentage,
  };
};

/* =========================================================
   CONTACT INFORMATION
========================================================= */

const contactScore = (
  resumeText
) => {
  let score = 0;

  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

  const phoneRegex =
    /(?:\+?\d[\d\s\-()]{7,}\d)/;

  const urlRegex =
    /(linkedin\.com|github\.com|https?:\/\/|www\.)/i;

  if (
    emailRegex.test(
      resumeText
    )
  ) {
    score += 1;
  }

  if (
    phoneRegex.test(
      resumeText
    )
  ) {
    score += 1;
  }

  if (
    urlRegex.test(
      resumeText
    )
  ) {
    score += 1;
  }

  return score;
};

/* =========================================================
   MEASURABLE ACHIEVEMENTS
========================================================= */

const achievementSignals = (
  resumeText
) => {
  const patterns = [
    /\b\d+%/g,
    /\b\d+\+/g,
    /\b\d+\s*(clients?|projects?|videos?|designs?|campaigns?|users?|customers?|sales)\b/gi,
    /\b(increased|improved|reduced|grew|saved|boosted|achieved|delivered|generated)\b/gi,
  ];

  let count = 0;

  for (
    const pattern of
    patterns
  ) {
    const matches =
      resumeText.match(
        pattern
      );

    count +=
      matches?.length ||
      0;
  }

  return count;
};

/* =========================================================
   DATE SIGNALS
========================================================= */

const countDateSignals = (
  resumeText
) => {
  const patterns = [
    /\b(19|20)\d{2}\b/g,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(19|20)\d{2}\b/gi,
    /\b(present|current)\b/gi,
  ];

  let count = 0;

  for (
    const pattern of
    patterns
  ) {
    count +=
      resumeText.match(
        pattern
      )?.length ||
      0;
  }

  return count;
};

/* =========================================================
   BULLET SIGNALS
========================================================= */

const countBulletSignals = (
  resumeText
) => {
  const lines =
    resumeText.split(
      /\r?\n/
    );

  return lines.filter(
    (line) =>
      /^\s*[-•*▪◦●]\s+/.test(
        line
      )
  ).length;
};

/* =========================================================
   SCORE BLOCK BUILDER
========================================================= */

const buildScoreBlock = ({
  rawScore,
  max,
  explanation,
  evidence = [],
}) => {
  const score =
    clamp(
      roundScore(
        rawScore
      ),
      0,
      max
    );

  const percentage =
    max > 0
      ? Math.round(
          (
            score /
            max
          ) *
            100
        )
      : 0;

  return {
    score,
    max,
    percentage,
    explanation,
    evidence,
  };
};

/* =========================================================
   RATING
========================================================= */

const getRating = (
  score
) => {
  if (
    score >= 85
  ) {
    return "Excellent";
  }

  if (
    score >= 70
  ) {
    return "Good";
  }

  if (
    score >= 50
  ) {
    return "Needs Improvement";
  }

  return "Poor";
};

/* =========================================================
   MAIN SCORING FUNCTION
========================================================= */

export const calculateDeterministicATSScore =
  ({
    resumeText,
    jobDescription = "",
  }) => {
    if (
      !resumeText ||
      !resumeText.trim()
    ) {
      throw new Error(
        "Resume text is required for ATS scoring."
      );
    }

    const hasJD =
      Boolean(
        jobDescription.trim()
      );

    const wordCount =
      countWords(
        resumeText
      );

    const skills =
      detectStableSkills(
        resumeText
      );

    const keywordMatch =
      getKeywordMatch(
        resumeText,
        jobDescription
      );

    const contacts =
      contactScore(
        resumeText
      );

    const achievements =
      achievementSignals(
        resumeText
      );

    const dateSignals =
      countDateSignals(
        resumeText
      );

    const bulletSignals =
      countBulletSignals(
        resumeText
      );

    const sectionPresence = {
      summary:
        hasSection(
          resumeText,
          SECTION_GROUPS.summary
        ),

      experience:
        hasSection(
          resumeText,
          SECTION_GROUPS.experience
        ),

      education:
        hasSection(
          resumeText,
          SECTION_GROUPS.education
        ),

      skills:
        hasSection(
          resumeText,
          SECTION_GROUPS.skills
        ),

      projects:
        hasSection(
          resumeText,
          SECTION_GROUPS.projects
        ),

      certifications:
        hasSection(
          resumeText,
          SECTION_GROUPS.certifications
        ),

      achievements:
        hasSection(
          resumeText,
          SECTION_GROUPS.achievements
        ),
    };

    /* =====================================================
       WEIGHTS

       WITH JD:
       30 + 25 + 15 + 15 + 5 + 5 + 5 = 100

       WITHOUT JD:
       JD weight redistributed:
       40 + 0 + 20 + 20 + 7 + 7 + 6 = 100
    ====================================================== */

    const maxScores =
      hasJD
        ? {
            keywordSkillMatch:
              30,

            jobRelevance:
              25,

            atsStructure:
              15,

            relevantExperience:
              15,

            educationCertifications:
              5,

            achievementsImpact:
              5,

            formattingReadability:
              5,
          }
        : {
            keywordSkillMatch:
              40,

            jobRelevance:
              0,

            atsStructure:
              20,

            relevantExperience:
              20,

            educationCertifications:
              7,

            achievementsImpact:
              7,

            formattingReadability:
              6,
          };

    /* =====================================================
       1. KEYWORD / SKILL MATCH
    ====================================================== */

    let keywordPercentage;

    if (hasJD) {
      keywordPercentage =
        keywordMatch.percentage;
    } else {
      /*
        Resume-only mode:
        stable professional skill coverage.
      */

      const skillCount =
        skills.length;

      if (
        skillCount >= 12
      ) {
        keywordPercentage =
          95;
      } else if (
        skillCount >= 9
      ) {
        keywordPercentage =
          88;
      } else if (
        skillCount >= 6
      ) {
        keywordPercentage =
          78;
      } else if (
        skillCount >= 4
      ) {
        keywordPercentage =
          68;
      } else if (
        skillCount >= 2
      ) {
        keywordPercentage =
          55;
      } else if (
        skillCount === 1
      ) {
        keywordPercentage =
          40;
      } else {
        keywordPercentage =
          20;
      }
    }

    const keywordScore =
      buildScoreBlock({
        rawScore:
          (
            keywordPercentage /
            100
          ) *
          maxScores
            .keywordSkillMatch,

        max:
          maxScores
            .keywordSkillMatch,

        explanation:
          hasJD
            ? `${keywordMatch.matched.length} of ${keywordMatch.keywords.length} important job-description keywords were found in the resume.`
            : `${skills.length} professional skill signals were detected in the resume. Resume-only scoring is used because no Job Description was supplied.`,

        evidence:
          hasJD
            ? keywordMatch.matched.slice(
                0,
                8
              )
            : skills.slice(
                0,
                8
              ),
      });

    /* =====================================================
       2. JOB RELEVANCE
    ====================================================== */

    let jobRelevanceScore;

    if (hasJD) {
      /*
        Uses deterministic keyword coverage.
        Slightly stricter than pure skill score.
      */

      const relevancePercentage =
        clamp(
          keywordMatch.percentage *
            0.92,
          0,
          100
        );

      jobRelevanceScore =
        buildScoreBlock({
          rawScore:
            (
              relevancePercentage /
              100
            ) *
            maxScores
              .jobRelevance,

          max:
            maxScores
              .jobRelevance,

          explanation:
            `${keywordMatch.percentage}% of the selected job-description keyword set appears in the resume.`,

          evidence:
            keywordMatch.matched.slice(
              0,
              8
            ),
        });
    } else {
      jobRelevanceScore = {
        score: 0,
        max: 0,
        percentage: 0,

        explanation:
          "No Job Description was provided. Job-specific relevance was not scored and its weight was redistributed across the resume-only categories.",

        evidence: [],
      };
    }

    /* =====================================================
       3. ATS STRUCTURE
    ====================================================== */

    let structurePoints = 0;

    if (
      sectionPresence.summary
    ) {
      structurePoints += 16;
    }

    if (
      sectionPresence.experience
    ) {
      structurePoints += 24;
    }

    if (
      sectionPresence.education
    ) {
      structurePoints += 18;
    }

    if (
      sectionPresence.skills
    ) {
      structurePoints += 20;
    }

    if (
      sectionPresence.projects
    ) {
      structurePoints += 8;
    }

    if (
      contacts >= 2
    ) {
      structurePoints += 8;
    }

    if (
      bulletSignals >= 3
    ) {
      structurePoints += 6;
    }

    const structurePercentage =
      clamp(
        structurePoints,
        0,
        100
      );

    const structureScore =
      buildScoreBlock({
        rawScore:
          (
            structurePercentage /
            100
          ) *
          maxScores
            .atsStructure,

        max:
          maxScores
            .atsStructure,

        explanation:
          "Score is based on recognizable resume sections, contact details, and readable content organization.",

        evidence: [
          sectionPresence.summary
            ? "Summary/Profile section detected"
            : null,

          sectionPresence.experience
            ? "Experience section detected"
            : null,

          sectionPresence.education
            ? "Education section detected"
            : null,

          sectionPresence.skills
            ? "Skills section detected"
            : null,

          contacts >= 2
            ? "Multiple contact details detected"
            : null,

          bulletSignals >= 3
            ? "Bullet-style content detected"
            : null,
        ].filter(Boolean),
      });

    /* =====================================================
       4. RELEVANT EXPERIENCE
    ====================================================== */

    let experiencePercentage =
      20;

    if (
      sectionPresence.experience
    ) {
      experiencePercentage +=
        42;
    }

    if (
      dateSignals >= 2
    ) {
      experiencePercentage +=
        18;
    }

    if (
      skills.length >= 4
    ) {
      experiencePercentage +=
        10;
    }

    if (
      achievements >= 1
    ) {
      experiencePercentage +=
        10;
    }

    experiencePercentage =
      clamp(
        experiencePercentage,
        0,
        100
      );

    const experienceScore =
      buildScoreBlock({
        rawScore:
          (
            experiencePercentage /
            100
          ) *
          maxScores
            .relevantExperience,

        max:
          maxScores
            .relevantExperience,

        explanation:
          "Score is based on the presence of professional experience, date signals, skills, and evidence of work impact.",

        evidence: [
          sectionPresence.experience
            ? "Experience section detected"
            : "No clear Experience heading detected",

          dateSignals > 0
            ? `${dateSignals} employment/date signals detected`
            : "No clear employment dates detected",

          skills.length > 0
            ? `${skills.length} professional skill signals detected`
            : null,
        ].filter(Boolean),
      });

    /* =====================================================
       5. EDUCATION / CERTIFICATIONS
    ====================================================== */

    let educationPercentage =
      0;

    if (
      sectionPresence.education
    ) {
      educationPercentage +=
        75;
    }

    if (
      sectionPresence.certifications
    ) {
      educationPercentage +=
        25;
    }

    educationPercentage =
      clamp(
        educationPercentage,
        0,
        100
      );

    const educationScore =
      buildScoreBlock({
        rawScore:
          (
            educationPercentage /
            100
          ) *
          maxScores
            .educationCertifications,

        max:
          maxScores
            .educationCertifications,

        explanation:
          "Score is based on clearly identifiable education and certification sections.",

        evidence: [
          sectionPresence.education
            ? "Education section detected"
            : null,

          sectionPresence.certifications
            ? "Certification/training section detected"
            : null,
        ].filter(Boolean),
      });

    /* =====================================================
       6. ACHIEVEMENTS / IMPACT
    ====================================================== */

    let achievementPercentage =
      15;

    if (
      sectionPresence.achievements
    ) {
      achievementPercentage +=
        25;
    }

    if (
      achievements >= 1
    ) {
      achievementPercentage +=
        25;
    }

    if (
      achievements >= 3
    ) {
      achievementPercentage +=
        20;
    }

    if (
      achievements >= 5
    ) {
      achievementPercentage +=
        15;
    }

    achievementPercentage =
      clamp(
        achievementPercentage,
        0,
        100
      );

    const achievementScore =
      buildScoreBlock({
        rawScore:
          (
            achievementPercentage /
            100
          ) *
          maxScores
            .achievementsImpact,

        max:
          maxScores
            .achievementsImpact,

        explanation:
          "Score rewards measurable achievements, quantified outcomes, and clearly stated impact.",

        evidence: [
          achievements > 0
            ? `${achievements} measurable impact signals detected`
            : "Few or no measurable impact signals detected",

          sectionPresence.achievements
            ? "Achievements/Awards section detected"
            : null,
        ].filter(Boolean),
      });

    /* =====================================================
       7. FORMATTING / READABILITY
    ====================================================== */

    let formattingPercentage =
      40;

    if (
      wordCount >= 180 &&
      wordCount <= 900
    ) {
      formattingPercentage +=
        25;
    }

    if (
      sectionPresence.experience &&
      sectionPresence.skills
    ) {
      formattingPercentage +=
        15;
    }

    if (
      contacts >= 2
    ) {
      formattingPercentage +=
        10;
    }

    if (
      bulletSignals >= 3
    ) {
      formattingPercentage +=
        10;
    }

    formattingPercentage =
      clamp(
        formattingPercentage,
        0,
        100
      );

    const formattingScore =
      buildScoreBlock({
        rawScore:
          (
            formattingPercentage /
            100
          ) *
          maxScores
            .formattingReadability,

        max:
          maxScores
            .formattingReadability,

        explanation:
          "Score is based on readable resume length, clear sections, contact details, and structured bullet-style content.",

        evidence: [
          `${wordCount} words detected`,

          contacts >= 2
            ? "Contact information appears readable"
            : null,

          bulletSignals >= 3
            ? `${bulletSignals} bullet-style lines detected`
            : null,
        ].filter(Boolean),
      });

    /* =====================================================
       FINAL TOTAL
    ====================================================== */

    const scores = {
      keywordSkillMatch:
        keywordScore,

      jobRelevance:
        jobRelevanceScore,

      atsStructure:
        structureScore,

      relevantExperience:
        experienceScore,

      educationCertifications:
        educationScore,

      achievementsImpact:
        achievementScore,

      formattingReadability:
        formattingScore,
    };

    const totalScore =
      clamp(
        roundScore(
          Object.values(
            scores
          ).reduce(
            (
              total,
              item
            ) =>
              total +
              item.score,
            0
          )
        ),
        0,
        100
      );

    const rating =
      getRating(
        totalScore
      );

    return {
      score:
        totalScore,

      rating,

      scores,

      meta: {
        mode:
          hasJD
            ? "job-description"
            : "resume-only",

        wordCount,

        detectedSkillCount:
          skills.length,

        deterministicSkills:
          skills,

        jdKeywords:
          hasJD
            ? keywordMatch.keywords
            : [],

        matchedJDKeywords:
          hasJD
            ? keywordMatch.matched
            : [],

        missingJDKeywords:
          hasJD
            ? keywordMatch.missing
            : [],
      },
    };
  };

export default calculateDeterministicATSScore;