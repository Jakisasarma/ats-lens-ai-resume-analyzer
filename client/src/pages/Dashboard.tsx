import {
  ArrowRight,
  BarChart3,
  FileSearch,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  ScanSearch,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTheme,
} from "../context/ThemeContext";

import {
  getResumeAnalysis,
  getResumeHistory,
} from "../services/resumeApi";

import type {
  HistoryItem,
} from "../services/resumeApi";

import "../styles/Dashboard.css";

type ScoreBlock = {
  score?: number;
  max?: number;
  percentage?: number;
  explanation?: string;
  evidence?: string[];
};

type LatestAnalysis = {
  _id?: string;

  candidate?: {
    name?: string;
    currentTitle?: string;
  };

  ats?: {
    score?: number;
    rating?: string;
    summary?: string;
  };

  scores?: Record<
    string,
    ScoreBlock
  >;

  skills?: {
    detected?: string[];
    matched?: string[];
    missing?: string[];
    partial?: string[];
  };

  strengths?: string[];
  weaknesses?: string[];
  atsRisks?: string[];
  recommendations?: string[];

  finalVerdict?: string;

  jobDescription?: string;
};

const Dashboard = () => {
  const navigate =
    useNavigate();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const [
    analyses,
    setAnalyses,
  ] = useState<HistoryItem[]>([]);

  const [
    latestAnalysis,
    setLatestAnalysis,
  ] =
    useState<LatestAnalysis | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    avatarError,
    setAvatarError,
  ] = useState(false);

  const [
    animatedScore,
    setAnimatedScore,
  ] = useState(0);

  /* =========================================================
     USER
  ========================================================= */

  const storedUser =
    localStorage.getItem(
      "atsLensUser"
    ) ||
    sessionStorage.getItem(
      "atsLensUser"
    );

  let userName =
    "ATS Lens User";

  let userEmail = "";

  let userAvatar = "";

  if (storedUser) {
    try {
      const user =
        JSON.parse(
          storedUser
        );

      userName =
        user?.name ||
        "ATS Lens User";

      userEmail =
        user?.email ||
        "";

      userAvatar =
        user?.avatar ||
        "";
    } catch (err) {
      console.error(
        "Unable to read user:",
        err
      );
    }
  }

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getResumeHistory();

          const analyzed =
            (
              response.analyses ||
              []
            ).filter(
              (item) =>
                item.status ===
                "analyzed"
            );

          setAnalyses(
            analyzed
          );

          if (
            analyzed.length > 0 &&
            analyzed[0]?._id
          ) {
            try {
              const latestResponse =
                await getResumeAnalysis(
                  analyzed[0]._id
                );

              const latestData =
                latestResponse?.analysis ||
                latestResponse;

              setLatestAnalysis(
                latestData as LatestAnalysis
              );
            } catch (
              latestError
            ) {
              console.error(
                "Unable to load latest analysis details:",
                latestError
              );

              setLatestAnalysis(
                null
              );
            }
          } else {
            setLatestAnalysis(
              null
            );
          }
        } catch (err) {
          console.error(err);

          setError(
            "Unable to load dashboard data."
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  /* =========================================================
     CORE STATS
  ========================================================= */

  const totalAnalyses =
    analyses.length;

  const latestScore =
    analyses.length > 0
      ? analyses[0]
          .ats?.score ??
        null
      : null;

  const bestScore =
    useMemo(() => {
      const scores =
        analyses
          .map(
            (item) =>
              item.ats?.score
          )
          .filter(
            (
              score
            ): score is number =>
              typeof score ===
              "number"
          );

      if (
        scores.length === 0
      ) {
        return null;
      }

      return Math.max(
        ...scores
      );
    }, [analyses]);

  const recentAnalyses =
    analyses.slice(
      0,
      4
    );

  /* =========================================================
     SCORE ANIMATION
  ========================================================= */

  useEffect(() => {
    if (
      loading ||
      typeof latestScore !==
        "number"
    ) {
      setAnimatedScore(0);
      return;
    }

    const safeScore =
      Math.max(
        0,
        Math.min(
          latestScore,
          100
        )
      );

    const duration =
      1400;

    const startTime =
      performance.now();

    let animationFrame = 0;

    const animateScore = (
      currentTime: number
    ) => {
      const elapsed =
        currentTime -
        startTime;

      const progress =
        Math.min(
          elapsed /
            duration,
          1
        );

      const easedProgress =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const currentScore =
        Math.round(
          safeScore *
            easedProgress
        );

      setAnimatedScore(
        currentScore
      );

      if (
        progress < 1
      ) {
        animationFrame =
          requestAnimationFrame(
            animateScore
          );
      }
    };

    animationFrame =
      requestAnimationFrame(
        animateScore
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [
    latestScore,
    loading,
  ]);

  /* =========================================================
     LATEST ANALYSIS DETAILS
  ========================================================= */

  const scoreEntries =
    useMemo(() => {
      return Object.entries(
        latestAnalysis?.scores ||
          {}
      );
    }, [latestAnalysis]);

  const missingSkills =
    latestAnalysis?.skills
      ?.missing ||
    [];

  const matchedSkills =
    latestAnalysis?.skills
      ?.matched ||
    [];

  const detectedSkills =
    latestAnalysis?.skills
      ?.detected ||
    [];

  const recommendations =
    latestAnalysis
      ?.recommendations ||
    [];

  const strengths =
    latestAnalysis
      ?.strengths ||
    [];

  /* =========================================================
     JOB / RESUME MATCH
  ========================================================= */

  const resumeMatch =
    useMemo(() => {
      if (
        scoreEntries.length ===
        0
      ) {
        return null;
      }

      const match =
        scoreEntries.find(
          ([key]) => {
            const normalized =
              key
                .replace(
                  /[^a-zA-Z]/g,
                  ""
                )
                .toLowerCase();

            return (
              normalized.includes(
                "jobrelevance"
              ) ||
              normalized.includes(
                "relevance"
              ) ||
              normalized.includes(
                "match"
              )
            );
          }
        );

      if (!match) {
        return null;
      }

      const block =
        match[1];

      if (
        typeof block
          ?.percentage ===
        "number"
      ) {
        return Math.round(
          block.percentage
        );
      }

      if (
        typeof block?.score ===
          "number" &&
        typeof block?.max ===
          "number" &&
        block.max > 0
      ) {
        return Math.round(
          (
            block.score /
            block.max
          ) *
            100
        );
      }

      return null;
    }, [scoreEntries]);

  const resumeMatchLabel =
    useMemo(() => {
      if (
        resumeMatch === null
      ) {
        return "Not available";
      }

      if (
        resumeMatch >= 85
      ) {
        return "Excellent match";
      }

      if (
        resumeMatch >= 70
      ) {
        return "Strong match";
      }

      if (
        resumeMatch >= 50
      ) {
        return "Moderate match";
      }

      return "Low match";
    }, [resumeMatch]);

  /* =========================================================
     GAUGE
  ========================================================= */

  const gaugeStyle = {
    "--score":
      `${animatedScore}`,
  } as CSSProperties;

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
     HELPERS
  ========================================================= */

  const formatDate = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleDateString();
  };

  const formatScoreTitle = (
    value: string
  ) => {
    return value
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(
        /^./,
        (char) =>
          char.toUpperCase()
      );
  };

  const getScorePercentage = (
    block: ScoreBlock
  ) => {
    if (
      typeof block.percentage ===
      "number"
    ) {
      return Math.max(
        0,
        Math.min(
          block.percentage,
          100
        )
      );
    }

    if (
      typeof block.score ===
        "number" &&
      typeof block.max ===
        "number" &&
      block.max > 0
    ) {
      return Math.max(
        0,
        Math.min(
          (
            block.score /
            block.max
          ) *
            100,
          100
        )
      );
    }

    return 0;
  };

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

        {/* ===================================================
            NAVIGATION
        ==================================================== */}

        <nav className="dash-nav">

          {/* HOMEPAGE */}

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

          {/* DASHBOARD */}

          <button
            type="button"
            className="dash-nav-item active"
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

          {/* ANALYZE */}

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

          {/* HISTORY */}

          <button
            type="button"
            className="dash-nav-item"
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

        {/* ===================================================
            FOOTER
        ==================================================== */}

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
              <Sun size={18} />
            ) : (
              <Moon size={18} />
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

        {/* HEADER */}

        <header className="dash-header">

          <div>

            <span className="dash-kicker">
              Resume Intelligence
            </span>

            <h1>
              Resume Review Dashboard
            </h1>

            <p>
              Analyze ATS compatibility,
              review resume performance,
              discover missing skills,
              and improve every
              application.
            </p>

          </div>

          <div className="dash-user-card">

            <div className="dash-user-avatar">

              {userAvatar &&
              !avatarError ? (
                <img
                  src={
                    userAvatar
                  }
                  alt={`${userName} profile`}
                  onError={() =>
                    setAvatarError(
                      true
                    )
                  }
                />
              ) : (
                <User
                  size={19}
                />
              )}

            </div>

            <div className="dash-user-info">

              <strong>
                {userName}
              </strong>

              {userEmail && (
                <span>
                  {userEmail}
                </span>
              )}

            </div>

          </div>

        </header>

        {error && (
          <div className="dash-error">
            {error}
          </div>
        )}

        {/* ===================================================
            OVERVIEW
        ==================================================== */}

        <section className="dash-overview-grid">

          <article className="dash-overview-card dash-score-card">

            <div className="dash-card-label">
              Latest ATS Score
            </div>

            <div
              className="dash-score-gauge"
              style={
                gaugeStyle
              }
            >

              <div className="dash-score-gauge-inner">

                <strong>
                  {loading
                    ? "..."
                    : typeof latestScore ===
                      "number"
                    ? animatedScore
                    : "—"}
                </strong>

                <span>
                  / 100
                </span>

              </div>

            </div>

            <div className="dash-score-caption">

              <strong>
                {latestAnalysis
                  ?.ats
                  ?.rating ||
                  "No rating yet"}
              </strong>

              <span>
                Most recent resume
                evaluation
              </span>

            </div>

          </article>

          <article className="dash-overview-card">

            <div className="dash-overview-icon">
              <Target
                size={20}
              />
            </div>

            <div className="dash-card-label">
              Resume Match
            </div>

            <strong className="dash-overview-value dash-overview-text-value">
              {resumeMatch !==
              null
                ? `${resumeMatch}%`
                : "—"}
            </strong>

            <span className="dash-overview-status">
              {resumeMatchLabel}
            </span>

            <p>
              Based on available job
              relevance data from your
              latest analysis.
            </p>

          </article>

          <article className="dash-overview-card">

            <div className="dash-overview-icon">
              <TrendingUp
                size={20}
              />
            </div>

            <div className="dash-card-label">
              Best ATS Score
            </div>

            <strong className="dash-overview-value">
              {loading
                ? "..."
                : bestScore ??
                  "—"}
            </strong>

            <span className="dash-overview-status">
              Highest recorded score
            </span>

            <p>
              Your best ATS performance
              across completed analyses.
            </p>

          </article>

          <article className="dash-overview-card">

            <div className="dash-overview-icon warning">
              <FileSearch
                size={20}
              />
            </div>

            <div className="dash-card-label">
              Missing Skills
            </div>

            <strong className="dash-overview-value">
              {latestAnalysis
                ? missingSkills.length
                : "—"}
            </strong>

            <span className="dash-overview-status">
              Latest resume
            </span>

            <p>
              Skills identified as
              missing from the latest
              resume comparison.
            </p>

          </article>

        </section>

        {/* ===================================================
            MINI STATS
        ==================================================== */}

        <section className="dash-mini-stats">

          <article>

            <BarChart3
              size={19}
            />

            <div>
              <span>
                Total Analyses
              </span>

              <strong>
                {loading
                  ? "..."
                  : totalAnalyses}
              </strong>
            </div>

          </article>

          <article>

            <FileSearch
              size={19}
            />

            <div>
              <span>
                Detected Skills
              </span>

              <strong>
                {latestAnalysis
                  ? detectedSkills.length
                  : "—"}
              </strong>
            </div>

          </article>

          <article>

            <Target
              size={19}
            />

            <div>
              <span>
                Matched Skills
              </span>

              <strong>
                {latestAnalysis
                  ? matchedSkills.length
                  : "—"}
              </strong>
            </div>

          </article>

          <article>

            <Sparkles
              size={19}
            />

            <div>
              <span>
                Recommendations
              </span>

              <strong>
                {latestAnalysis
                  ? recommendations.length
                  : "—"}
              </strong>
            </div>

          </article>

        </section>

        {/* ===================================================
            SCORE BREAKDOWN + MISSING SKILLS
        ==================================================== */}

        <section className="dash-intelligence-grid">

          <div className="dash-data-card">

            <div className="dash-data-card-header">

              <div>

                <span className="dash-kicker">
                  Performance
                </span>

                <h2>
                  ATS Score Breakdown
                </h2>

              </div>

              {latestAnalysis?._id && (
                <button
                  type="button"
                  className="dash-small-link"
                  onClick={() =>
                    navigate(
                      `/results/${latestAnalysis._id}`
                    )
                  }
                >
                  View full analysis

                  <ArrowRight
                    size={15}
                  />
                </button>
              )}

            </div>

            {loading ? (

              <div className="dash-data-empty">
                Loading score
                breakdown...
              </div>

            ) : scoreEntries.length >
              0 ? (

              <div className="dash-score-breakdown">

                {scoreEntries.map(
                  ([
                    key,
                    block,
                  ]) => {
                    const percentage =
                      getScorePercentage(
                        block
                      );

                    return (
                      <div
                        className="dash-breakdown-row"
                        key={key}
                      >

                        <div className="dash-breakdown-top">

                          <strong>
                            {formatScoreTitle(
                              key
                            )}
                          </strong>

                          <span>
                            {block.score ??
                              "—"}
                            {" / "}
                            {block.max ??
                              "—"}
                          </span>

                        </div>

                        <div className="dash-progress-track">

                          <span
                            style={{
                              width:
                                `${percentage}%`,
                            }}
                          />

                        </div>

                        {block.explanation && (
                          <p>
                            {
                              block.explanation
                            }
                          </p>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            ) : (

              <div className="dash-data-empty">

                <BarChart3
                  size={28}
                />

                <strong>
                  No detailed score
                  breakdown available
                </strong>

                <span>
                  Analyze a resume to
                  view category-level
                  ATS performance.
                </span>

              </div>

            )}

          </div>

          <div className="dash-data-card">

            <div className="dash-data-card-header">

              <div>

                <span className="dash-kicker">
                  Keywords
                </span>

                <h2>
                  Missing Skills
                </h2>

              </div>

            </div>

            {loading ? (

              <div className="dash-data-empty">
                Loading skills...
              </div>

            ) : missingSkills.length >
              0 ? (

              <>

                <p className="dash-data-description">
                  These skills were
                  identified as missing
                  from your latest resume
                  comparison.
                </p>

                <div className="dash-skill-chips">

                  {missingSkills.map(
                    (
                      skill,
                      index
                    ) => (
                      <span
                        key={`${skill}-${index}`}
                      >
                        {skill}
                      </span>
                    )
                  )}

                </div>

              </>

            ) : (

              <div className="dash-data-empty">

                <Target
                  size={28}
                />

                <strong>
                  No missing skills
                  available
                </strong>

                <span>
                  Add a job description
                  during analysis to get
                  a stronger skill
                  comparison.
                </span>

              </div>

            )}

          </div>

        </section>

        {/* ===================================================
            INSIGHTS
        ==================================================== */}

        <section className="dash-section">

          <div className="dash-section-title">

            <div>

              <span className="dash-kicker">
                AI Intelligence
              </span>

              <h2>
                Resume Insights
              </h2>

            </div>

          </div>

          <div className="dash-insight-grid">

            <article className="dash-insight-card">

              <div className="dash-insight-heading">

                <Sparkles
                  size={19}
                />

                <h3>
                  Recommendations
                </h3>

              </div>

              {recommendations.length >
              0 ? (

                <ul>

                  {recommendations
                    .slice(
                      0,
                      4
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

              ) : (

                <p className="dash-insight-empty">
                  No recommendations
                  available yet.
                </p>

              )}

            </article>

            <article className="dash-insight-card">

              <div className="dash-insight-heading">

                <TrendingUp
                  size={19}
                />

                <h3>
                  Key Strengths
                </h3>

              </div>

              {strengths.length >
              0 ? (

                <ul>

                  {strengths
                    .slice(
                      0,
                      4
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

              ) : (

                <p className="dash-insight-empty">
                  No strengths available
                  yet.
                </p>

              )}

            </article>

          </div>

        </section>

        {/* ===================================================
            QUICK ACTION
        ==================================================== */}

        <section className="dash-section">

          <div className="dash-action-card">

            <div className="dash-action-left">

              <div className="dash-action-icon">
                <FileSearch
                  size={26}
                />
              </div>

              <div>

                <span className="dash-kicker">
                  New Analysis
                </span>

                <h3>
                  Review another resume
                </h3>

                <p>
                  Upload a PDF or DOCX
                  resume and receive an
                  evidence-based ATS
                  compatibility analysis.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="dash-primary-button"
              onClick={() =>
                navigate(
                  "/analyze"
                )
              }
            >
              Analyze Resume

              <ArrowRight
                size={17}
              />
            </button>

          </div>

        </section>

        {/* ===================================================
            RECENT
        ==================================================== */}

        <section className="dash-section">

          <div className="dash-section-title">

            <div>

              <span className="dash-kicker">
                Recent Activity
              </span>

              <h2>
                Recent Analyses
              </h2>

            </div>

            <button
              type="button"
              className="dash-link-button"
              onClick={() =>
                navigate(
                  "/history"
                )
              }
            >
              View History
            </button>

          </div>

          {loading ? (

            <div className="dash-empty">
              Loading...
            </div>

          ) : recentAnalyses.length ===
            0 ? (

            <div className="dash-empty">

              <History
                size={34}
              />

              <h3>
                No recent analyses
              </h3>

              <p>
                Analyze your first
                resume to create
                history.
              </p>

            </div>

          ) : (

            <div className="dash-recent-list">

              {recentAnalyses.map(
                (item) => (
                  <button
                    type="button"
                    className="dash-recent-row"
                    key={item._id}
                    onClick={() =>
                      navigate(
                        `/results/${item._id}`
                      )
                    }
                  >

                    <div className="dash-recent-main">

                      <strong>
                        {item.candidate
                          ?.name ||
                          item.fileName}
                      </strong>

                      <span>
                        {item.candidate
                          ?.currentTitle ||
                          item.fileName}
                      </span>

                    </div>

                    <div className="dash-recent-meta">

                      <strong>
                        {item.ats
                          ?.score ??
                          "—"}
                      </strong>

                      <span>
                        {item.ats
                          ?.rating ||
                          "—"}
                      </span>

                      <small>
                        {formatDate(
                          item.createdAt
                        )}
                      </small>

                      <ArrowRight
                        size={16}
                      />

                    </div>

                  </button>
                )
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            WORKFLOW
        ==================================================== */}

        <section className="dash-section">

          <div className="dash-section-title">

            <div>

              <span className="dash-kicker">
                Workflow
              </span>

              <h2>
                How ATS Lens Works
              </h2>

            </div>

          </div>

          <div className="dash-workflow-grid">

            <article className="dash-workflow-card">

              <div className="dash-workflow-number">
                01
              </div>

              <h3>
                Upload
              </h3>

              <p>
                Upload your PDF or DOCX
                resume securely.
              </p>

            </article>

            <article className="dash-workflow-card">

              <div className="dash-workflow-number">
                02
              </div>

              <h3>
                Analyze
              </h3>

              <p>
                ATS Lens reviews skills,
                experience, structure,
                and relevant content.
              </p>

            </article>

            <article className="dash-workflow-card">

              <div className="dash-workflow-number">
                03
              </div>

              <h3>
                Score
              </h3>

              <p>
                Receive a deterministic
                ATS compatibility score
                and category breakdown.
              </p>

            </article>

            <article className="dash-workflow-card">

              <div className="dash-workflow-number">
                04
              </div>

              <h3>
                Improve
              </h3>

              <p>
                Review risks, missing
                skills, strengths, and
                recommendations.
              </p>

            </article>

          </div>

        </section>

      </main>

    </div>
  );
};

export default Dashboard;