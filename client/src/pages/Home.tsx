import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileSearch,
  Moon,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";

import {
  useEffect,
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

import "../styles/Home.css";

const Home = () => {
  const navigate = useNavigate();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const [
    animationProgress,
    setAnimationProgress,
  ] = useState(0);

  /* =========================================================
     AUTH STATUS
  ========================================================= */

  const token =
    localStorage.getItem("atsLensToken") ||
    sessionStorage.getItem("atsLensToken");

  const isLoggedIn = Boolean(token);

  /* =========================================================
     PREVIEW ANIMATION
  ========================================================= */

  useEffect(() => {
    const duration = 1800;

    const startTime =
      performance.now();

    let frame = 0;

    const animate = (
      currentTime: number
    ) => {
      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      setAnimationProgress(
        eased
      );

      if (progress < 1) {
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
  }, []);

  /* =========================================================
     DEMO VALUES
  ========================================================= */

  const atsScore =
    Math.round(
      84 *
        animationProgress
    );

  const keywordMatch =
    Math.round(
      82 *
        animationProgress
    );

  const atsStructure =
    Math.round(
      90 *
        animationProgress
    );

  const experience =
    Math.round(
      78 *
        animationProgress
    );

  const detectedSkills =
    Math.round(
      14 *
        animationProgress
    );

  const recommendations =
    Math.round(
      7 *
        animationProgress
    );

  const atsRisks =
    Math.round(
      2 *
        animationProgress
    );

  const gaugeStyle = {
    "--preview-score":
      atsScore,
  } as CSSProperties;

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const scrollToSection = (
    id: string
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleHeroAnalyze =
    () => {
      if (isLoggedIn) {
        navigate("/analyze");
      } else {
        navigate("/login");
      }
    };

  const handleSecondaryTop =
    () => {
      if (isLoggedIn) {
        navigate(
          "/dashboard"
        );
      } else {
        navigate(
          "/login"
        );
      }
    };

  const handlePrimaryTop =
    () => {
      if (isLoggedIn) {
        navigate(
          "/analyze"
        );
      } else {
        navigate(
          "/register"
        );
      }
    };

  return (
    <div className="home-page">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="home-background">

        <div className="home-orb orb-one" />
        <div className="home-orb orb-two" />
        <div className="home-orb orb-three" />

        <div className="home-line line-one" />
        <div className="home-line line-two" />

      </div>

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="home-navbar">

        <button
          type="button"
          className="home-brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <div className="home-brand-icon">
            <ScanSearch
              size={22}
            />
          </div>

          <div className="home-brand-copy">
            <strong>
              ATS LENS
            </strong>

            <small>
              AI Resume Analyzer
            </small>
          </div>
        </button>

        <nav className="home-nav-links">

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "features"
              )
            }
          >
            Features
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "how-it-works"
              )
            }
          >
            How It Works
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "why-ats-lens"
              )
            }
          >
            Why ATS Lens
          </button>

        </nav>

        <div className="home-nav-actions">

          <button
            type="button"
            className="home-theme-button"
            onClick={
              toggleTheme
            }
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          <button
            type="button"
            className="home-login-button"
            onClick={
              handleSecondaryTop
            }
          >
            {isLoggedIn
              ? "Dashboard"
              : "Sign In"}
          </button>

          <button
            type="button"
            className="home-get-started"
            onClick={
              handlePrimaryTop
            }
          >
            {isLoggedIn
              ? "Analyze Resume"
              : "Get Started"}

            <ArrowRight
              size={15}
            />
          </button>

        </div>

      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <main className="home-hero">

        <section className="home-hero-copy">

          <div className="home-eyebrow">
            <Sparkles
              size={14}
            />

            AI-Powered Resume Intelligence
          </div>

          <h1>
            See your
            <br />
            resume
            <span>
              through an ATS
              <br />
              lens.
            </span>
          </h1>

          <p>
            Measure ATS compatibility,
            discover missing skills,
            understand resume strengths
            and weaknesses, and receive
            evidence-based recommendations
            before you apply.
          </p>

          <div className="home-hero-actions">

            <button
              type="button"
              className="home-primary-cta"
              onClick={
                handleHeroAnalyze
              }
            >
              <FileSearch
                size={17}
              />

              Analyze Resume

              <ArrowRight
                size={17}
              />
            </button>

            <button
              type="button"
              className="home-secondary-cta"
              onClick={() =>
                scrollToSection(
                  "how-it-works"
                )
              }
            >
              See How It Works
            </button>

          </div>

          <div className="home-trust-row">

            <span>
              <CheckCircle2
                size={14}
              />
              PDF & DOCX
            </span>

            <span>
              <CheckCircle2
                size={14}
              />
              ATS Score 0–100
            </span>

            <span>
              <CheckCircle2
                size={14}
              />
              Downloadable Report
            </span>

          </div>

        </section>

        {/* ===================================================
            DEMO PREVIEW
        ==================================================== */}

        <section className="home-preview-wrap">

          <div className="home-floating-card card-one">

            <Target
              size={19}
            />

            <div>
              <span>
                Job Match
              </span>

              <strong>
                Smart comparison
              </strong>
            </div>

          </div>

          <div className="home-preview">

            <div className="home-preview-top">

              <div>
                <span>
                  Resume Intelligence
                </span>

                <strong>
                  ATS Review
                </strong>
              </div>

              <div className="home-preview-status">
                Demo Preview
              </div>

            </div>

            <div className="home-preview-grid">

              <div className="home-preview-score">

                <span>
                  ATS Score
                </span>

                <div
                  className="home-preview-gauge"
                  style={
                    gaugeStyle
                  }
                >

                  <div>
                    <strong>
                      {atsScore}
                    </strong>

                    <small>
                      /100
                    </small>
                  </div>

                </div>

                <b>
                  {atsScore >= 85
                    ? "Excellent"
                    : atsScore >= 70
                    ? "Good"
                    : atsScore >= 50
                    ? "Needs Improvement"
                    : atsScore === 0
                    ? "Analyzing..."
                    : "Poor"}
                </b>

              </div>

              <div className="home-preview-details">

                <article>

                  <span>
                    Keyword Match
                  </span>

                  <strong>
                    {keywordMatch}%
                  </strong>

                  <div>
                    <i
                      style={{
                        width:
                          `${keywordMatch}%`,
                      }}
                    />
                  </div>

                </article>

                <article>

                  <span>
                    ATS Structure
                  </span>

                  <strong>
                    {atsStructure}%
                  </strong>

                  <div>
                    <i
                      style={{
                        width:
                          `${atsStructure}%`,
                      }}
                    />
                  </div>

                </article>

                <article>

                  <span>
                    Experience
                  </span>

                  <strong>
                    {experience}%
                  </strong>

                  <div>
                    <i
                      style={{
                        width:
                          `${experience}%`,
                      }}
                    />
                  </div>

                </article>

              </div>

            </div>

            <div className="home-preview-bottom">

              <div>
                <span>
                  Detected Skills
                </span>

                <strong>
                  {detectedSkills}
                </strong>
              </div>

              <div>
                <span>
                  Recommendations
                </span>

                <strong>
                  {recommendations}
                </strong>
              </div>

              <div>
                <span>
                  ATS Risks
                </span>

                <strong>
                  {atsRisks}
                </strong>
              </div>

            </div>

          </div>

          <div className="home-floating-card card-two">

            <TrendingUp
              size={19}
            />

            <div>
              <span>
                Better Resume
              </span>

              <strong>
                Actionable insights
              </strong>
            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section
        id="features"
        className="home-section"
      >

        <div className="home-section-heading">

          <span>
            Features
          </span>

          <h2>
            Resume intelligence built
            for better applications.
          </h2>

          <p>
            ATS Lens combines structured
            scoring with clear AI-powered
            feedback so you can understand
            what is working and what needs
            improvement.
          </p>

        </div>

        <div className="home-feature-grid">

          <article>

            <div className="home-feature-icon">
              <BarChart3
                size={22}
              />
            </div>

            <h3>
              ATS Compatibility Score
            </h3>

            <p>
              Get a clear 0–100 ATS
              compatibility score with a
              detailed category breakdown.
            </p>

          </article>

          <article>

            <div className="home-feature-icon">
              <Target
                size={22}
              />
            </div>

            <h3>
              Skill Matching
            </h3>

            <p>
              Identify detected, matched,
              missing, and partially
              matched skills.
            </p>

          </article>

          <article>

            <div className="home-feature-icon">
              <Sparkles
                size={22}
              />
            </div>

            <h3>
              AI Recommendations
            </h3>

            <p>
              Review strengths, weaknesses,
              ATS risks, and practical
              improvement recommendations.
            </p>

          </article>

          <article>

            <div className="home-feature-icon">
              <BriefcaseBusiness
                size={22}
              />
            </div>

            <h3>
              Job Description Match
            </h3>

            <p>
              Add a target job description
              and measure resume relevance
              to that role.
            </p>

          </article>

          <article>

            <div className="home-feature-icon">
              <ShieldCheck
                size={22}
              />
            </div>

            <h3>
              ATS Structure Review
            </h3>

            <p>
              Review structure, formatting,
              readability, and ATS-friendly
              resume content.
            </p>

          </article>

          <article>

            <div className="home-feature-icon">
              <Download
                size={22}
              />
            </div>

            <h3>
              Downloadable Report
            </h3>

            <p>
              Generate and save a
              professional ATS analysis
              report for future review.
            </p>

          </article>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        id="how-it-works"
        className="home-workflow-section"
      >

        <div className="home-section">

          <div className="home-section-heading">

            <span>
              How It Works
            </span>

            <h2>
              From resume upload to
              actionable insight.
            </h2>

            <p>
              A simple four-step workflow
              designed to make resume
              optimization easier.
            </p>

          </div>

          <div className="home-workflow">

            <article>

              <div className="home-step-number">
                01
              </div>

              <Upload
                size={24}
              />

              <h3>
                Upload
              </h3>

              <p>
                Upload your PDF or DOCX
                resume securely.
              </p>

            </article>

            <ArrowRight
              className="home-step-arrow"
              size={20}
            />

            <article>

              <div className="home-step-number">
                02
              </div>

              <FileSearch
                size={24}
              />

              <h3>
                Analyze
              </h3>

              <p>
                ATS Lens reviews skills,
                structure, experience,
                education, and impact.
              </p>

            </article>

            <ArrowRight
              className="home-step-arrow"
              size={20}
            />

            <article>

              <div className="home-step-number">
                03
              </div>

              <BarChart3
                size={24}
              />

              <h3>
                Score
              </h3>

              <p>
                Receive a deterministic
                ATS score and category
                breakdown.
              </p>

            </article>

            <ArrowRight
              className="home-step-arrow"
              size={20}
            />

            <article>

              <div className="home-step-number">
                04
              </div>

              <TrendingUp
                size={24}
              />

              <h3>
                Improve
              </h3>

              <p>
                Use clear recommendations
                to strengthen your resume
                before applying.
              </p>

            </article>

          </div>

        </div>

      </section>

      {/* =====================================================
          WHY ATS LENS
      ====================================================== */}

      <section
        id="why-ats-lens"
        className="home-section"
      >

        <div className="home-about-card">

          <div>

            <span className="home-about-kicker">
              Why ATS Lens
            </span>

            <h2>
              Understand what an ATS sees
              before you submit.
            </h2>

            <p>
              ATS Lens focuses on
              measurable resume signals
              instead of vague advice.
              Scores remain structured,
              while AI helps explain the
              results in clear language.
            </p>

          </div>

          <div className="home-about-points">

            <span>
              <CheckCircle2
                size={17}
              />
              Evidence-based analysis
            </span>

            <span>
              <CheckCircle2
                size={17}
              />
              Clear 0–100 score
            </span>

            <span>
              <CheckCircle2
                size={17}
              />
              Skill gap identification
            </span>

            <span>
              <CheckCircle2
                size={17}
              />
              ATS-focused recommendations
            </span>

            <span>
              <CheckCircle2
                size={17}
              />
              Downloadable professional report
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="home-final-cta">

        <span>
          Ready to Analyze?
        </span>

        <h2>
          See your resume through an
          ATS lens.
        </h2>

        <p>
          Upload your resume and receive
          a structured ATS compatibility
          analysis with clear
          recommendations.
        </p>

        <button
          type="button"
          onClick={
            handleHeroAnalyze
          }
        >
          <FileSearch
            size={17}
          />

          Analyze Resume

          <ArrowRight
            size={17}
          />
        </button>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="home-footer">

        <div className="home-footer-brand">

          <ScanSearch
            size={17}
          />

          <strong>
            ATS LENS
          </strong>

        </div>

        <span>
          AI Resume Analyzer · Recruitment Intelligence
        </span>

      </footer>

    </div>
  );
};

export default Home;