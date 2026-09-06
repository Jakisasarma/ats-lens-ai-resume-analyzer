import {
  Check,
  FileSearch,
  FileText,
  History,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Moon,
  ScanSearch,
  Sparkles,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  DragEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  uploadResume,
} from "../services/resumeApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Dashboard.css";
import "../styles/Analyze.css";

/* =========================================================
   LOADING STEPS
========================================================= */

const loadingSteps = [
  "Uploading resume...",
  "Reading resume content...",
  "Detecting skills and experience...",
  "Calculating ATS compatibility...",
  "Generating recommendations...",
];

/* =========================================================
   STEP DURATIONS
========================================================= */

const loadingDurations = [
  800,
  1000,
  1200,
  1300,
  2200,
];

const TOTAL_LOADING_DURATION =
  loadingDurations.reduce(
    (total, duration) =>
      total + duration,
    0
  );

/* =========================================================
   ANALYZE PAGE
========================================================= */

const Analyze = () => {
  const navigate =
    useNavigate();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  const [
    jobDescription,
    setJobDescription,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingStep,
    setLoadingStep,
  ] = useState(0);

  /* =========================================================
     VISUAL STEP TIMER
  ========================================================= */

  useEffect(() => {
    if (!loading) {
      return;
    }

    if (
      loadingStep >=
      loadingSteps.length
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setLoadingStep(
            (current) =>
              Math.min(
                current + 1,
                loadingSteps.length
              )
          );
        },
        loadingDurations[
          loadingStep
        ]
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    loading,
    loadingStep,
  ]);

  /* =========================================================
     FILE VALIDATION
  ========================================================= */

  const validateFile = (
    file: File
  ) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const validExtension =
      extension === "pdf" ||
      extension === "docx";

    if (
      !allowedTypes.includes(
        file.type
      ) &&
      !validExtension
    ) {
      setError(
        "Only PDF and DOCX files are allowed."
      );

      return false;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {
      setError(
        "Resume file must be 5 MB or smaller."
      );

      return false;
    }

    setError("");

    return true;
  };

  /* =========================================================
     HANDLE FILE
  ========================================================= */

  const handleFile = (
    file: File
  ) => {
    if (
      !validateFile(file)
    ) {
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleInputChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (
    event:
      DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (
    event:
      DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
  };

  const removeSelectedFile =
    () => {
      setSelectedFile(null);
      setError("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* =========================================================
     ANALYZE
  ========================================================= */

  const handleAnalyze =
    async () => {
      if (!selectedFile) {
        setError(
          "Please upload your resume first."
        );

        return;
      }

      try {
        setError("");
        setLoadingStep(0);
        setLoading(true);

        const startedAt =
          Date.now();

        const response =
          await uploadResume(
            selectedFile,
            jobDescription
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Resume analysis failed."
          );
        }

        const analysis =
          response.analysis;

        const analysisId =
          analysis?.id ||
          analysis?._id;

        if (!analysisId) {
          throw new Error(
            "Analysis ID was not returned."
          );
        }

        const elapsed =
          Date.now() -
          startedAt;

        const remaining =
          TOTAL_LOADING_DURATION -
          elapsed;

        if (remaining > 0) {
          await new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                remaining
              );
            }
          );
        }

        setLoadingStep(
          loadingSteps.length
        );

        await new Promise<void>(
          (resolve) => {
            window.requestAnimationFrame(
              () => {
                window.requestAnimationFrame(
                  () => {
                    resolve();
                  }
                );
              }
            );
          }
        );

        navigate(
          `/results/${analysisId}`
        );
      } catch (err: any) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to analyze resume."
        );
      } finally {
        setLoading(false);
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
     UI
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
            <Home size={18} />

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
            className="dash-nav-item active"
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
          RIGHT SIDE ANALYZE CONTENT
      ====================================================== */}

      <main className="dash-main">

        <div className="analyze-page">

          <main className="analyze-main">

            <section className="analyze-heading">

              <span className="analyze-kicker">
                Resume Intelligence
              </span>

              <h1>
                Analyze Resume
              </h1>

              <p>
                Upload your resume and
                optionally add a job
                description to receive
                an evidence-based ATS
                compatibility analysis.
              </p>

            </section>

            {/* =================================================
                GRID
            ================================================== */}

            <section className="analyze-grid">

              {/* UPLOAD */}

              <div className="analyze-card">

                <div className="analyze-step-head">

                  <div className="analyze-step-number">
                    01
                  </div>

                  <div>

                    <span>
                      Step 01
                    </span>

                    <h2>
                      Upload Resume
                    </h2>

                  </div>

                </div>

                {!selectedFile ? (

                  <div
                    className="resume-dropzone"
                    onDrop={
                      handleDrop
                    }
                    onDragOver={
                      handleDragOver
                    }
                    onClick={() =>
                      fileInputRef
                        .current
                        ?.click()
                    }
                  >

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={
                        handleInputChange
                      }
                      hidden
                    />

                    <div className="resume-upload-icon">
                      <UploadCloud
                        size={28}
                      />
                    </div>

                    <h3>
                      Upload your resume
                    </h3>

                    <p>
                      Drag and drop your
                      PDF or DOCX file
                      here, or click to
                      browse.
                    </p>

                    <span>
                      PDF or DOCX • Max 5 MB
                    </span>

                  </div>

                ) : (

                  <div className="selected-resume-card">

                    <div className="selected-resume-icon">
                      <FileText
                        size={22}
                      />
                    </div>

                    <div className="selected-resume-info">

                      <strong>
                        {
                          selectedFile.name
                        }
                      </strong>

                      <span>
                        {(
                          selectedFile.size /
                          1024 /
                          1024
                        ).toFixed(2)}
                        {" MB"}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={
                        removeSelectedFile
                      }
                      aria-label="Remove selected resume"
                    >
                      <X
                        size={18}
                      />
                    </button>

                  </div>

                )}

              </div>

              {/* JOB DESCRIPTION */}

              <div className="analyze-card">

                <div className="analyze-step-head">

                  <div className="analyze-step-number">
                    02
                  </div>

                  <div>

                    <span>
                      Step 02
                    </span>

                    <h2>
                      Job Description
                    </h2>

                  </div>

                </div>

                <div className="job-description-section">

                  <label htmlFor="jobDescription">

                    Job Description

                    <span>
                      Optional
                    </span>

                  </label>

                  <textarea
                    id="jobDescription"
                    placeholder="Paste the target job description here to compare your resume against the role..."
                    value={
                      jobDescription
                    }
                    onChange={(event) =>
                      setJobDescription(
                        event.target.value
                      )
                    }
                  />

                  <p>
                    Add a job description
                    for job-specific skill
                    matching and relevance
                    analysis.
                  </p>

                </div>

              </div>

            </section>

            {error && (
              <div className="analyze-error">
                {error}
              </div>
            )}

            {/* =================================================
                ACTION BAR
            ================================================== */}

            <div className="analyze-action-bar">

              <div>

                <strong>
                  Ready to analyze?
                </strong>

                <span>
                  ATS Lens will evaluate
                  structure, skills,
                  experience and ATS
                  compatibility.
                </span>

              </div>

              <button
                type="button"
                className="analyze-button"
                onClick={
                  handleAnalyze
                }
                disabled={
                  loading ||
                  !selectedFile
                }
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="spin"
                    />

                    Analyzing...
                  </>
                ) : (
                  "Analyze Resume"
                )}
              </button>

            </div>

          </main>

        </div>

      </main>

      {/* =====================================================
          LOADING OVERLAY
      ====================================================== */}

      {loading && (

        <div className="analysis-loading-overlay">

          <div className="analysis-loading-card">

            <div className="analysis-loader-visual">

              <div className="analysis-loader-ring">

                <ScanSearch
                  size={34}
                />

              </div>

              <div className="analysis-scan-line" />

            </div>

            <span className="analysis-loading-kicker">
              ATS Intelligence
            </span>

            <h2>
              Analyzing your resume
            </h2>

            <p>
              Please wait while ATS
              Lens reviews your resume.
            </p>

            <div className="analysis-loading-steps">

              {loadingSteps.map(
                (
                  step,
                  index
                ) => {
                  const completed =
                    index <
                    loadingStep;

                  const active =
                    index ===
                      loadingStep &&
                    loadingStep <
                      loadingSteps.length;

                  const waiting =
                    index >
                    loadingStep;

                  return (
                    <div
                      key={step}
                      className={`analysis-loading-step ${
                        completed
                          ? "completed"
                          : active
                          ? "active"
                          : waiting
                          ? "waiting"
                          : ""
                      }`}
                    >

                      <div className="analysis-step-indicator">

                        {completed ? (
                          <Check
                            size={16}
                            strokeWidth={3}
                          />
                        ) : (
                          index + 1
                        )}

                      </div>

                      <div className="analysis-step-content">

                        <span>
                          {step}
                        </span>

                        <div className="analysis-step-progress">
                          <div />
                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Analyze;