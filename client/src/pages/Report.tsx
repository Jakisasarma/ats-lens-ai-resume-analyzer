import {
  ArrowLeft,
  Download,
  FileSearch,
  FileText,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Printer,
  ScanSearch,
  Sparkles,
  Sun,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  getResumeAnalysis,
} from "../services/resumeApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Dashboard.css";
import "../styles/Report.css";

type Analysis = {
  _id?: string;

  candidate?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    currentTitle?: string;
  };

  ats?: {
    score?: number;
    rating?: string;
    summary?: string;
  };

  scores?: Record<
    string,
    {
      score?: number;
      max?: number;
      percentage?: number;
      explanation?: string;
      evidence?: string[];
    }
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

  fileName?: string;
  createdAt?: string;

  jobDescription?: string;
};

const Report = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const reportRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    analysis,
    setAnalysis,
  ] = useState<Analysis | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     LOAD REPORT
  ========================================================= */

  useEffect(() => {
    const loadReport =
      async () => {
        try {
          setLoading(true);
          setError("");

          if (!id) {
            throw new Error(
              "Report ID not found."
            );
          }

          const response =
            await getResumeAnalysis(
              id
            );

          const data =
            response?.analysis ||
            response;

          setAnalysis(
            data as Analysis
          );
        } catch (err: any) {
          console.error(
            "Report load error:",
            err
          );

          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Unable to load report."
          );
        } finally {
          setLoading(false);
        }
      };

    loadReport();
  }, [id]);

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint =
    () => {
      window.print();
    };

  /* =========================================================
     PDF DOWNLOAD
  ========================================================= */

  const handleDownloadPDF =
    async () => {
      if (
        !reportRef.current ||
        !analysis
      ) {
        return;
      }

      try {
        setDownloading(true);

        const reportElement =
          reportRef.current;

        const canvas =
          await html2canvas(
            reportElement,
            {
              scale: 2,
              useCORS: true,
              backgroundColor:
                "#ffffff",
              logging: false,
              windowWidth:
                reportElement.scrollWidth,
            }
          );

        const imageData =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );

        const pdf =
          new jsPDF(
            "p",
            "mm",
            "a4"
          );

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const margin =
          8;

        const contentWidth =
          pageWidth -
          margin * 2;

        const contentHeight =
          pageHeight -
          margin * 2;

        const imageHeight =
          (
            canvas.height *
            contentWidth
          ) /
          canvas.width;

        let heightLeft =
          imageHeight;

        let position =
          margin;

        pdf.addImage(
          imageData,
          "JPEG",
          margin,
          position,
          contentWidth,
          imageHeight,
          undefined,
          "FAST"
        );

        heightLeft -=
          contentHeight;

        while (
          heightLeft > 0
        ) {
          position =
            margin -
            (
              imageHeight -
              heightLeft
            );

          pdf.addPage();

          pdf.addImage(
            imageData,
            "JPEG",
            margin,
            position,
            contentWidth,
            imageHeight,
            undefined,
            "FAST"
          );

          heightLeft -=
            contentHeight;
        }

        const candidateName =
          analysis.candidate
            ?.name ||
          "ATS-Resume";

        const safeName =
          candidateName
            .replace(
              /[^a-zA-Z0-9-_ ]/g,
              ""
            )
            .trim()
            .replace(
              /\s+/g,
              "-"
            );

        pdf.save(
          `${safeName}-ATS-Report.pdf`
        );
      } catch (err) {
        console.error(
          "PDF download error:",
          err
        );

        setError(
          "Unable to generate PDF. Please try again."
        );
      } finally {
        setDownloading(false);
      }
    };

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
      <div className="report-state-page">

        <div className="report-state-card">

          <div className="report-loader" />

          <h2>
            Loading report
          </h2>

          <p>
            Preparing your ATS
            analysis report.
          </p>

        </div>

      </div>
    );
  }

  if (
    error ||
    !analysis
  ) {
    return (
      <div className="report-state-page">

        <div className="report-state-card">

          <FileText
            size={34}
          />

          <h2>
            Report unavailable
          </h2>

          <p>
            {error ||
              "Unable to load this report."}
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

  const score =
    analysis.ats?.score ??
    0;

  const scoreEntries =
    Object.entries(
      analysis.scores ||
        {}
    );

  const jobDescriptionProvided =
    Boolean(
      analysis.jobDescription
        ?.trim()
    );

  return (
    <div className="dash-shell report-dashboard-shell">

      {/* SIDEBAR */}

      <aside className="dash-sidebar report-app-sidebar">

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
            <Home size={18} />
            <span>Homepage</span>
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
            <span>Dashboard</span>
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
            <span>Analyze Resume</span>
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
            <span>History</span>
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
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            <span>
              {theme === "dark"
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
            <LogOut size={18} />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* RIGHT */}

      <main className="dash-main report-dashboard-main">

        <div className="report-page-final">

          <div className="report-toolbar-final">

            <button
              type="button"
              className="report-back-button"
              onClick={() =>
                navigate(
                  `/results/${id}`
                )
              }
            >
              <ArrowLeft
                size={18}
              />

              Back to Results
            </button>

            <div className="report-toolbar-actions">

              <button
                type="button"
                className="report-secondary-button"
                onClick={
                  handlePrint
                }
              >
                <Printer
                  size={18}
                />

                Print
              </button>

              <button
                type="button"
                className="report-primary-button"
                onClick={
                  handleDownloadPDF
                }
                disabled={
                  downloading
                }
              >
                <Download
                  size={18}
                />

                {downloading
                  ? "Generating PDF..."
                  : "Download PDF"}
              </button>

            </div>

          </div>

          {/* ===================================================
              REPORT SHEET
          ==================================================== */}

          <main
            className="report-sheet-final"
            ref={reportRef}
          >

            <header className="report-header-final">

              <div>

                <span className="report-kicker">
                  ATS LENS
                </span>

                <h1>
                  ATS Resume Analysis
                  Report
                </h1>

                <p>
                  Evidence-based analysis
                  generated from the
                  uploaded resume content.
                </p>

              </div>

              <div className="report-score-box">

                <span>
                  ATS Score
                </span>

                <strong>
                  {score}
                </strong>

                <small>
                  / 100
                </small>

              </div>

            </header>

            {/* CANDIDATE */}

            <section className="report-section-final">

              <div className="report-section-heading">

                <span>
                  Candidate
                </span>

                <h2>
                  Profile Summary
                </h2>

              </div>

              <div className="report-profile-grid">

                <div>
                  <label>Name</label>

                  <strong>
                    {analysis.candidate
                      ?.name ||
                      "Not detected"}
                  </strong>
                </div>

                <div>
                  <label>
                    Current Title
                  </label>

                  <strong>
                    {analysis.candidate
                      ?.currentTitle ||
                      "Not detected"}
                  </strong>
                </div>

                <div>
                  <label>Email</label>

                  <strong>
                    {analysis.candidate
                      ?.email ||
                      "Not detected"}
                  </strong>
                </div>

                <div>
                  <label>Phone</label>

                  <strong>
                    {analysis.candidate
                      ?.phone ||
                      "Not detected"}
                  </strong>
                </div>

                <div>
                  <label>Location</label>

                  <strong>
                    {analysis.candidate
                      ?.location ||
                      "Not detected"}
                  </strong>
                </div>

                <div>
                  <label>Resume</label>

                  <strong>
                    {analysis.fileName ||
                      "Resume"}
                  </strong>
                </div>

              </div>

            </section>

            {/* ASSESSMENT */}

            <section className="report-section-final">

              <div className="report-section-heading">

                <span>
                  Overall Assessment
                </span>

                <h2>
                  {analysis.ats
                    ?.rating ||
                    "Not Rated"}
                </h2>

              </div>

              <p className="report-summary-text">
                {analysis.ats
                  ?.summary ||
                  "No summary available."}
              </p>

            </section>

            {/* SCORE */}

            <section className="report-section-final">

              <div className="report-section-heading">

                <span>
                  Score Breakdown
                </span>

                <h2>
                  ATS Compatibility
                  Categories
                </h2>

              </div>

              <div className="report-score-grid">

                {scoreEntries.map(
                  ([
                    key,
                    block,
                  ]) => (
                    <article
                      className="report-score-card"
                      key={key}
                    >

                      <div className="report-score-card-top">

                        <h3>
                          {formatScoreTitle(
                            key
                          )}
                        </h3>

                        <strong>
                          {block?.score ??
                            0}
                          {" / "}
                          {block?.max ??
                            "—"}
                        </strong>

                      </div>

                      <div className="report-progress">

                        <span
                          style={{
                            width:
                              `${
                                block
                                  ?.percentage ??
                                0
                              }%`,
                          }}
                        />

                      </div>

                      <p>
                        {block
                          ?.explanation ||
                          "No explanation available."}
                      </p>

                    </article>
                  )
                )}

              </div>

            </section>

            {/* SKILLS */}

            <section className="report-section-final">

              <div className="report-section-heading">

                <span>
                  Skills
                </span>

                <h2>
                  Skill Analysis
                </h2>

              </div>

              <div className="report-skill-grid">

                <ReportList
                  title="Detected Skills"
                  items={
                    analysis.skills
                      ?.detected
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <ReportList
                  title="Matched Skills"
                  items={
                    analysis.skills
                      ?.matched
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <ReportList
                  title="Missing Skills"
                  items={
                    analysis.skills
                      ?.missing
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

                <ReportList
                  title="Partial Matches"
                  items={
                    analysis.skills
                      ?.partial
                  }
                  jobDescriptionProvided={
                    jobDescriptionProvided
                  }
                />

              </div>

            </section>

            {/* INSIGHTS */}

            <section className="report-section-final">

              <div className="report-section-heading">

                <span>
                  Insights
                </span>

                <h2>
                  Resume Findings
                </h2>

              </div>

              <div className="report-insight-grid">

                <ReportList
                  title="Strengths"
                  items={
                    analysis.strengths
                  }
                  jobDescriptionProvided
                />

                <ReportList
                  title="Weaknesses"
                  items={
                    analysis.weaknesses
                  }
                  jobDescriptionProvided
                />

                <ReportList
                  title="ATS Risks"
                  items={
                    analysis.atsRisks
                  }
                  jobDescriptionProvided
                />

                <ReportList
                  title="Recommendations"
                  items={
                    analysis.recommendations
                  }
                  jobDescriptionProvided
                />

              </div>

            </section>

            {/* VERDICT */}

            <section className="report-verdict-final">

              <span className="report-kicker">
                Final Verdict
              </span>

              <h2>
                Resume Evaluation
              </h2>

              <p>
                {analysis.finalVerdict ||
                  "No final verdict available."}
              </p>

            </section>

            <footer className="report-footer-final">

              <strong>
                ATS Lens
              </strong>

              <p>
                This report is an
                AI-assisted resume
                evaluation intended for
                informational guidance.
                Hiring decisions may vary
                between employers and ATS
                platforms.
              </p>

            </footer>

          </main>

        </div>

      </main>

    </div>
  );
};

const ReportList = ({
  title,
  items,
  jobDescriptionProvided,
}: {
  title: string;
  items?: string[];
  jobDescriptionProvided: boolean;
}) => {
  const isJobComparisonSection =
    title ===
      "Matched Skills" ||
    title ===
      "Missing Skills" ||
    title ===
      "Partial Matches";

  return (
    <article className="report-list-card">

      <h3>
        {title}
      </h3>

      {items &&
      items.length > 0 ? (

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

      ) : !jobDescriptionProvided &&
        isJobComparisonSection ? (

        <p className="report-comparison-message">
          Add a Job Description
          to compare skills.
        </p>

      ) : (

        <p>
          No items available.
        </p>

      )}

    </article>
  );
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

export default Report;