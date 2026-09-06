import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  FileSearch,
  FileText,
  Gauge,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Moon,
  ScanSearch,
  Sparkles,
  Sun,
  Target,
  User,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getResumeAnalysis,
} from "../services/resumeApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Dashboard.css";
import "../styles/Results.css";

/* =========================================================
   TYPES
========================================================= */

type ScoreBlock = {
  score?: number;
  max?: number;
  percentage?: number;
  explanation?: string;
  evidence?: string[];
};

type RawScoreValue =
  | ScoreBlock
  | number
  | undefined
  | null;

type Analysis = {
  _id?: string;

  candidate?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    currentTitle?: string;
  };

  ats?: {
    score?: number;
    rating?: string;
    summary?: string;
  };

  /*
    Record<string, ...> is intentional.

    Some older saved analyses may use slightly
    different score property names.
  */
  scores?: Record<
    string,
    RawScoreValue
  >;

  skills?: {
    detected?: string[];
    matched?: string[];
    missing?: string[];
    partial?: string[];
  };

  atsRisks?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];

  finalVerdict?: string;

  fileName?: string;
  jobDescription?: string;
};

/* =========================================================
   SCORE HELPERS
========================================================= */

const isFiniteNumber = (
  value: unknown
): value is number => {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
};

/*
  Convert different saved score formats
  into one consistent ScoreBlock.
*/
const normalizeScoreBlock = (
  value: RawScoreValue,
  fallbackMax?: number
): ScoreBlock | undefined => {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  /*
    Older data may store only a number.
  */
  if (isFiniteNumber(value)) {
    const max =
      fallbackMax ?? 100;

    const percentage =
      max > 0
        ? Math.round(
            (value / max) * 100
          )
        : 0;

    return {
      score: value,
      max,
      percentage:
        Math.max(
          0,
          Math.min(
            percentage,
            100
          )
        ),
    };
  }

  if (
    typeof value !== "object"
  ) {
    return undefined;
  }

  const score =
    isFiniteNumber(
      value.score
    )
      ? value.score
      : undefined;

  const max =
    isFiniteNumber(
      value.max
    )
      ? value.max
      : fallbackMax;

  let percentage =
    isFiniteNumber(
      value.percentage
    )
      ? value.percentage
      : undefined;

  /*
    If percentage is absent but score/max exist,
    calculate only the display percentage.
  */
  if (
    percentage === undefined &&
    score !== undefined &&
    max !== undefined &&
    max > 0
  ) {
    percentage =
      Math.round(
        (score / max) * 100
      );
  }

  return {
    score,
    max,
    percentage:
      percentage !== undefined
        ? Math.max(
            0,
            Math.min(
              percentage,
              100
            )
          )
        : undefined,
    explanation:
      value.explanation,
    evidence:
      Array.isArray(
        value.evidence
      )
        ? value.evidence
        : undefined,
  };
};

/*
  Find a score using current key first,
  then support older possible stored keys.
*/
const findScore = (
  scores:
    | Record<
        string,
        RawScoreValue
      >
    | undefined,
  aliases: string[],
  fallbackMax?: number
): ScoreBlock | undefined => {
  if (!scores) {
    return undefined;
  }

  for (
    const key of aliases
  ) {
    const value =
      scores[key];

    if (
      value !== undefined &&
      value !== null
    ) {
      return normalizeScoreBlock(
        value,
        fallbackMax
      );
    }
  }

  return undefined;
};

/* =========================================================
   RESULTS
========================================================= */

const Results = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const [
    analysis,
    setAnalysis,
  ] =
    useState<Analysis | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    animatedScore,
    setAnimatedScore,
  ] =
    useState(0);

  /* =========================================================
     LOAD RESULT
  ========================================================= */

  useEffect(() => {
    const loadResult =
      async () => {
        try {
          setLoading(true);
          setError("");

          if (!id) {
            const stored =
              sessionStorage.getItem(
                "atsLensLatestAnalysis"
              );

            if (stored) {
              const parsed =
                JSON.parse(
                  stored
                );

              setAnalysis(
                parsed
              );

              return;
            }

            throw new Error(
              "Analysis result not found."
            );
          }

          const response =
            await getResumeAnalysis(
              id
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load analysis result."
            );
          }

          setAnalysis(
            response.analysis
          );
        } catch (err: any) {
          console.error(
            "Results load error:",
            err
          );

          setError(
            err?.response
              ?.data
              ?.message ||
              err?.message ||
              "Unable to load analysis result."
          );
        } finally {
          setLoading(false);
        }
      };

    loadResult();
  }, [id]);

  /* =========================================================
     TOTAL SCORE
  ========================================================= */

  const score =
    analysis?.ats?.score ??
    0;

  /* =========================================================
     SCORE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (
      loading ||
      !analysis
    ) {
      setAnimatedScore(
        0
      );

      return;
    }

    const target =
      Math.max(
        0,
        Math.min(
          score,
          100
        )
      );

    const duration =
      1500;

    const start =
      performance.now();

    let frame = 0;

    const animate = (
      now: number
    ) => {
      const progress =
        Math.min(
          (now - start) /
            duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      setAnimatedScore(
        Math.round(
          target * eased
        )
      );

      if (
        progress < 1
      ) {
        frame =
          requestAnimationFrame(
            animate
          );
      }
    };

    frame =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(
        frame
      );
    };
  }, [
    analysis,
    score,
    loading,
  ]);

  /* =========================================================
     JOB DESCRIPTION
  ========================================================= */

  const jobDescriptionProvided =
    Boolean(
      analysis
        ?.jobDescription
        ?.trim()
    );

  /* =========================================================
     WEIGHTS
  ========================================================= */

  /*
    JD PROVIDED
    Keyword / Skill       30
    Job Relevance         25
    ATS Structure         15
    Experience            15
    Education              5
    Achievements           5
    Formatting             5

    NO JD
    Keyword / Skill       40
    Job Relevance          0
    ATS Structure         20
    Experience            20
    Education              7
    Achievements           7
    Formatting             6
  */

  const weights =
    useMemo(
      () =>
        jobDescriptionProvided
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
            },
      [
        jobDescriptionProvided,
      ]
    );

  /* =========================================================
     NORMALIZED SCORE CATEGORIES
  ========================================================= */

  const categories =
    useMemo(() => {
      const scores =
        analysis?.scores;

      return [
        {
          key:
            "keywordSkillMatch",

          title:
            "Keyword / Skill Match",

          icon:
            Target,

          data:
            findScore(
              scores,
              [
                "keywordSkillMatch",
                "keywordSkill",
                "keywordMatch",
                "skillMatch",
                "keywordAndSkillMatch",
                "keywords",
              ],
              weights
                .keywordSkillMatch
            ),
        },

        {
          key:
            "jobRelevance",

          title:
            "Job Relevance",

          icon:
            Gauge,

          data:
            findScore(
              scores,
              [
                "jobRelevance",
                "jdRelevance",
                "jobDescriptionRelevance",
                "jobMatch",
                "relevance",
              ],
              weights
                .jobRelevance
            ),
        },

        {
          key:
            "atsStructure",

          title:
            "ATS Structure",

          icon:
            FileText,

          data:
            findScore(
              scores,
              [
                "atsStructure",
                "structure",
                "resumeStructure",
                "atsCompatibility",
                "atsStructureCompatibility",
              ],
              weights
                .atsStructure
            ),
        },

        {
          key:
            "relevantExperience",

          title:
            "Relevant Experience",

          icon:
            User,

          data:
            findScore(
              scores,
              [
                "relevantExperience",
                "experience",
                "experienceRelevance",
                "workExperience",
                "experienceMatch",
              ],
              weights
                .relevantExperience
            ),
        },

        {
          key:
            "educationCertifications",

          title:
            "Education & Certifications",

          icon:
            Award,

          data:
            findScore(
              scores,
              [
                "educationCertifications",
                "educationCertification",
                "educationAndCertifications",
                "education",
                "certifications",
              ],
              weights
                .educationCertifications
            ),
        },

        {
          key:
            "achievementsImpact",

          title:
            "Achievements & Impact",

          icon:
            Sparkles,

          data:
            findScore(
              scores,
              [
                "achievementsImpact",
                "achievementImpact",
                "achievements",
                "impact",
              ],
              weights
                .achievementsImpact
            ),
        },

        {
          key:
            "formattingReadability",

          title:
            "Formatting & Readability",

          icon:
            CheckCircle2,

          data:
            findScore(
              scores,
              [
                "formattingReadability",
                "formattingAndReadability",
                "formatting",
                "readability",
                "resumeFormatting",
              ],
              weights
                .formattingReadability
            ),
        },
      ];
    }, [
      analysis,
      weights,
    ]);

  /* =========================================================
     RATING
  ========================================================= */

  const rating =
    analysis?.ats
      ?.rating ||
    "Not Rated";

  /* =========================================================
     SCORE RING
  ========================================================= */

  const circumference =
    2 *
    Math.PI *
    54;

  const dashOffset =
    circumference -
    (animatedScore /
      100) *
      circumference;

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    () => {
      localStorage.removeItem(
        "atsLensToken"
      );

      localStorage.removeItem(
        "atsLensUser"
      );

      sessionStorage.removeItem(
        "atsLensToken"
      );

      sessionStorage.removeItem(
        "atsLensUser"
      );

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="results-state-page">

        <div className="results-state-card">

          <div className="results-loader" />

          <h2>
            Loading analysis
          </h2>

          <p>
            Retrieving your saved
            ATS result.
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !analysis
  ) {
    return (
      <div className="results-state-page">

        <div className="results-state-card">

          <XCircle
            size={34}
          />

          <h2>
            Result unavailable
          </h2>

          <p>
            {error ||
              "Analysis result not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/history"
              )
            }
          >
            Back to History
          </button>

        </div>

      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="dash-shell">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="dash-sidebar">

        <div className="dash-brand">

          <div className="dash-brand-icon">
            <ScanSearch
              size={21}
            />
          </div>

          <div>

            <strong>
              ATS LENS
            </strong>

            <span>
              AI Resume Analyzer
            </span>

          </div>

        </div>

        <nav className="dash-nav">

          <button
            type="button"
            className="dash-nav-item"
            onClick={() =>
              navigate("/")
            }
          >
            <Home
              size={18}
            />

            <span>
              Homepage
            </span>
          </button>

          <button
            type="button"
            className="dash-nav-item"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <LayoutDashboard
              size={18}
            />

            <span>
              Dashboard
            </span>
          </button>

          <button
            type="button"
            className="dash-nav-item"
            onClick={() =>
              navigate(
                "/analyze"
              )
            }
          >
            <FileSearch
              size={18}
            />

            <span>
              Analyze Resume
            </span>
          </button>

          <button
            type="button"
            className="dash-nav-item active"
            onClick={() =>
              navigate(
                "/history"
              )
            }
          >
            <History
              size={18}
            />

            <span>
              History
            </span>
          </button>

        </nav>

        <div className="dash-side-note">

          <Sparkles
            size={18}
          />

          <strong>
            Recruitment Intelligence
          </strong>

          <p>
            Measure ATS readiness
            before you apply.
          </p>

        </div>

        <div className="dash-sidebar-footer">

          <button
            type="button"
            className="dash-footer-button"
            onClick={
              toggleTheme
            }
          >
            {theme ===
            "dark" ? (
              <Sun
                size={18}
              />
            ) : (
              <Moon
                size={18}
              />
            )}

            <span>
              {theme ===
              "dark"
                ? "Light Mode"
                : "Dark Mode"}
            </span>
          </button>

          <button
            type="button"
            className="dash-footer-button danger"
            onClick={
              handleLogout
            }
          >
            <LogOut
              size={18}
            />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="dash-main">

        <div className="results-page-final">

          <main className="results-container-final">

            {/* TOPBAR */}

            <div className="results-topbar-final">

              <button
                type="button"
                className="results-back-button"
                onClick={() =>
                  navigate(
                    "/history"
                  )
                }
              >
                <ArrowLeft
                  size={18}
                />

                Back to History
              </button>

              <button
                type="button"
                className="results-report-button"
                onClick={() =>
                  navigate(
                    `/report/${
                      analysis._id ||
                      id ||
                      ""
                    }`
                  )
                }
              >
                <FileText
                  size={18}
                />

                View Report
              </button>

            </div>

            {/* =================================================
                HERO
            ================================================== */}

            <section className="results-hero-final">

              <div className="results-hero-copy">

                <span className="results-kicker">
                  AI ATS Analysis
                </span>

                <h1>
                  Resume Analysis Results
                </h1>

                <p>
                  Evidence-based ATS
                  evaluation generated
                  from your actual
                  resume content.
                </p>

              </div>

              <div className="results-score-ring">

                <svg
                  width="132"
                  height="132"
                  viewBox="0 0 132 132"
                >
                  <circle
                    cx="66"
                    cy="66"
                    r="54"
                    className="results-score-track"
                  />

                  <circle
                    cx="66"
                    cy="66"
                    r="54"
                    className="results-score-progress"
                    strokeDasharray={
                      circumference
                    }
                    strokeDashoffset={
                      dashOffset
                    }
                  />
                </svg>

                <div className="results-score-text">

                  <strong>
                    {animatedScore}
                  </strong>

                  <span>
                    / 100
                  </span>

                </div>

              </div>

            </section>

            {/* =================================================
                SUMMARY
            ================================================== */}

            <section className="results-summary-card">

              <div>

                <span className="results-kicker">
                  ATS Rating
                </span>

                <h2>
                  {rating}
                </h2>

                <p>
                  {analysis.ats
                    ?.summary ||
                    "No summary available."}
                </p>

              </div>

              <div className="results-summary-icon">

                <Sparkles
                  size={22}
                />

              </div>

            </section>

            {/* =================================================
                CANDIDATE
            ================================================== */}

            <section className="results-candidate-card">

              <div>

                <span className="results-kicker">
                  Candidate
                </span>

                <h2>
                  {analysis.candidate
                    ?.name ||
                    "Name not detected"}
                </h2>

                <p>
                  {analysis.candidate
                    ?.currentTitle ||
                    "Title not detected"}
                </p>

              </div>

              <div className="results-contact-list">

                {analysis.candidate
                  ?.email && (
                  <span>
                    {
                      analysis
                        .candidate
                        .email
                    }
                  </span>
                )}

                {analysis.candidate
                  ?.phone && (
                  <span>
                    {
                      analysis
                        .candidate
                        .phone
                    }
                  </span>
                )}

                {analysis.candidate
                  ?.location && (
                  <span>
                    {
                      analysis
                        .candidate
                        .location
                    }
                  </span>
                )}

              </div>

            </section>

            {/* =================================================
                SCORE BREAKDOWN
            ================================================== */}

            <section className="results-section-final">

              <div className="results-section-heading">

                <span className="results-kicker">
                  Score Breakdown
                </span>

                <h2>
                  ATS Compatibility Categories
                </h2>

              </div>

              <div className="results-category-grid">

                {categories.map(
                  ({
                    key,
                    title,
                    icon: Icon,
                    data,
                  }) => {
                    /*
                      No fake 0 / —.

                      If category data truly does not exist,
                      UI says Not available.
                    */

                    const hasScore =
                      data !==
                        undefined &&
                      isFiniteNumber(
                        data.score
                      );

                    const hasMax =
                      data !==
                        undefined &&
                      isFiniteNumber(
                        data.max
                      );

                    const percentage =
                      data
                        ?.percentage ??
                      0;

                    const isNoJDRelevance =
                      key ===
                        "jobRelevance" &&
                      !jobDescriptionProvided;

                    return (
                      <article
                        className="results-category-card"
                        key={key}
                      >

                        <div className="results-category-top">

                          <div className="results-category-icon">

                            <Icon
                              size={20}
                            />

                          </div>

                          <div>

                            <h3>
                              {title}
                            </h3>

                            <strong>
                              {isNoJDRelevance
                                ? "0 / 0"
                                : hasScore &&
                                  hasMax
                                ? `${data!.score} / ${data!.max}`
                                : hasScore
                                ? `${data!.score}`
                                : "Not available"}
                            </strong>

                          </div>

                        </div>

                        <div className="results-category-bar">

                          <span
                            style={{
                              width:
                                `${
                                  Math.max(
                                    0,
                                    Math.min(
                                      percentage,
                                      100
                                    )
                                  )
                                }%`,
                            }}
                          />

                        </div>

                        <p>
                          {data
                            ?.explanation ||
                            (isNoJDRelevance
                              ? "No Job Description was provided. Job-specific relevance was not scored and its weight was redistributed across the resume-only categories."
                              : "Score details were not stored for this category in this analysis.")}
                        </p>

                        {data
                          ?.evidence &&
                          data.evidence
                            .length >
                            0 && (
                          <ul>

                            {data.evidence
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  item,
                                  index
                                ) => (
                                  <li
                                    key={
                                      index
                                    }
                                  >
                                    {item}
                                  </li>
                                )
                              )}

                          </ul>
                        )}

                      </article>
                    );
                  }
                )}

              </div>

            </section>

            {/* =================================================
                SKILLS
            ================================================== */}

            <section className="results-section-final">

              <div className="results-section-heading">

                <span className="results-kicker">
                  Skills
                </span>

                <h2>
                  Skill Intelligence
                </h2>

              </div>

              <div className="results-skills-grid">

                <SkillBlock
                  title="Detected Skills"
                  items={
                    analysis
                      .skills
                      ?.detected
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <SkillBlock
                  title="Matched Skills"
                  items={
                    analysis
                      .skills
                      ?.matched
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <SkillBlock
                  title="Missing Skills"
                  items={
                    analysis
                      .skills
                      ?.missing
                  }
                  danger
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <SkillBlock
                  title="Partial Matches"
                  items={
                    analysis
                      .skills
                      ?.partial
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

              </div>

            </section>

            {/* =================================================
                INSIGHTS
            ================================================== */}

            <section className="results-insight-grid">

              <InsightBlock
                title="Strengths"
                icon={
                  CheckCircle2
                }
                items={
                  analysis
                    .strengths
                }
                positive
              />

              <InsightBlock
                title="Weaknesses"
                icon={
                  AlertTriangle
                }
                items={
                  analysis
                    .weaknesses
                }
              />

              <InsightBlock
                title="ATS Risks"
                icon={
                  XCircle
                }
                items={
                  analysis
                    .atsRisks
                }
                danger
              />

              <InsightBlock
                title="Recommendations"
                icon={
                  Lightbulb
                }
                items={
                  analysis
                    .recommendations
                }
                positive
              />

            </section>

            {/* =================================================
                VERDICT
            ================================================== */}

            <section className="results-verdict-card">

              <span className="results-kicker">
                Final Verdict
              </span>

              <h2>
                Resume Evaluation
              </h2>

              <p>
                {analysis
                  .finalVerdict ||
                  "No final verdict available."}
              </p>

            </section>

          </main>

        </div>

      </main>

    </div>
  );
};

/* =========================================================
   SKILL BLOCK
========================================================= */

const SkillBlock = ({
  title,
  items,
  danger = false,
  jobDescriptionProvided = true,
}: {
  title: string;
  items?: string[];
  danger?: boolean;
  jobDescriptionProvided?: boolean;
}) => {
  const isComparisonSection =
    title ===
      "Matched Skills" ||
    title ===
      "Missing Skills" ||
    title ===
      "Partial Matches";

  return (
    <article className="results-skill-card">

      <h3>
        {title}
      </h3>

      <div className="results-chip-list">

        {items &&
        items.length >
          0 ? (

          items.map(
            (
              item,
              index
            ) => (
              <span
                className={
                  danger
                    ? "results-chip danger"
                    : "results-chip"
                }
                key={`${item}-${index}`}
              >
                {item}
              </span>
            )
          )

        ) : !jobDescriptionProvided &&
          isComparisonSection ? (

          <span className="results-empty-text">
            Add a Job Description
            to compare skills.
          </span>

        ) : (

          <span className="results-empty-text">
            None detected
          </span>

        )}

      </div>

    </article>
  );
};

/* =========================================================
   INSIGHT BLOCK
========================================================= */

const InsightBlock = ({
  title,
  icon: Icon,
  items,
  positive = false,
  danger = false,
}: {
  title: string;
  icon: React.ElementType;
  items?: string[];
  positive?: boolean;
  danger?: boolean;
}) => {
  return (
    <article className="results-insight-card">

      <div className="results-insight-title">

        <div
          className={`results-insight-icon ${
            danger
              ? "danger"
              : positive
              ? "positive"
              : ""
          }`}
        >
          <Icon
            size={19}
          />
        </div>

        <h3>
          {title}
        </h3>

      </div>

      {items &&
      items.length >
        0 ? (

        <ul>

          {items.map(
            (
              item,
              index
            ) => (
              <li
                key={index}
              >
                {item}
              </li>
            )
          )}

        </ul>

      ) : (

        <p>
          No items available.
        </p>

      )}

    </article>
  );
};

export default Results;