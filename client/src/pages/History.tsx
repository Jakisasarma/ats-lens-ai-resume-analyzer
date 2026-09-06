import {
  Eye,
  FileSearch,
  History as HistoryIcon,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCcw,
  ScanSearch,
  Search,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  deleteResumeAnalysis,
  getResumeHistory,
} from "../services/resumeApi";

import type {
  HistoryItem,
} from "../services/resumeApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Dashboard.css";
import "../styles/History.css";

const History = () => {
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
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     LOAD HISTORY
  ========================================================= */

  const loadHistory =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getResumeHistory();

        if (!response.success) {
          throw new Error(
            response.message ||
              "Unable to load history."
          );
        }

        setAnalyses(
          response.analyses ||
            []
        );
      } catch (err: any) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to load resume history."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadHistory();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredAnalyses =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return analyses;
      }

      return analyses.filter(
        (item) => {
          const candidateName =
            item.candidate?.name ||
            "";

          const candidateTitle =
            item.candidate
              ?.currentTitle ||
            "";

          const fileName =
            item.fileName ||
            "";

          const rating =
            item.ats?.rating ||
            "";

          return [
            candidateName,
            candidateTitle,
            fileName,
            rating,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      analyses,
      search,
    ]);

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete =
    async (
      id: string
    ) => {
      const confirmed =
        window.confirm(
          "Delete this resume analysis?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        const response =
          await deleteResumeAnalysis(
            id
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              "Delete failed."
          );
        }

        setAnalyses(
          (current) =>
            current.filter(
              (item) =>
                item._id !== id &&
                item.id !== id
            )
        );
      } catch (err: any) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to delete analysis."
        );
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
            <HistoryIcon
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
          RIGHT SIDE HISTORY CONTENT
      ====================================================== */}

      <main className="dash-main">

        <div className="history-page">

          <main className="history-main">

            <section className="history-header">

              <div>

                <span className="history-kicker">
                  Resume Intelligence
                </span>

                <h1>
                  Analysis History
                </h1>

                <p>
                  Review your previous
                  ATS resume analyses.
                </p>

              </div>

              <button
                type="button"
                className="history-refresh-button"
                onClick={
                  loadHistory
                }
                disabled={
                  loading
                }
              >
                <RefreshCcw
                  size={17}
                  className={
                    loading
                      ? "history-spin"
                      : ""
                  }
                />

                Refresh
              </button>

            </section>

            {/* =================================================
                TOOLBAR
            ================================================== */}

            <section className="history-toolbar">

              <div className="history-search">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search resume history..."
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="history-count">

                {
                  filteredAnalyses.length
                }

                {" "}

                {filteredAnalyses.length ===
                1
                  ? "analysis"
                  : "analyses"}

              </div>

            </section>

            {error && (
              <div className="history-error">
                {error}
              </div>
            )}

            {/* =================================================
                CONTENT
            ================================================== */}

            {loading ? (

              <div className="history-state-card">

                <RefreshCcw
                  size={28}
                  className="history-spin"
                />

                <h3>
                  Loading history...
                </h3>

              </div>

            ) : filteredAnalyses.length ===
              0 ? (

              <div className="history-state-card">

                <h3>
                  No analyses found
                </h3>

                <p>
                  Analyze a resume first
                  and your results will
                  appear here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/analyze"
                    )
                  }
                >
                  Analyze Resume
                </button>

              </div>

            ) : (

              <section className="history-list">

                {filteredAnalyses.map(
                  (item) => {
                    const id =
                      item.id ||
                      item._id;

                    const candidateName =
                      item.candidate
                        ?.name ||
                      "Resume Analysis";

                    const candidateTitle =
                      item.candidate
                        ?.currentTitle ||
                      item.fileName;

                    const score =
                      item.ats
                        ?.score ??
                      0;

                    const rating =
                      item.ats
                        ?.rating ||
                      "Not Rated";

                    const date =
                      item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString()
                        : "";

                    return (
                      <article
                        key={id}
                        className="history-item"
                      >

                        <div className="history-item-main">

                          <div className="history-item-info">

                            <h3>
                              {
                                candidateName
                              }
                            </h3>

                            <p>
                              {
                                candidateTitle
                              }
                            </p>

                          </div>

                          <div className="history-item-score">

                            <strong>
                              {score}
                            </strong>

                            <span>
                              {rating}
                            </span>

                          </div>

                          <div className="history-item-date">
                            {date}
                          </div>

                          <div className="history-item-actions">

                            <button
                              type="button"
                              className="history-view-button"
                              onClick={() =>
                                navigate(
                                  `/results/${id}`
                                )
                              }
                              aria-label="View analysis"
                            >
                              <Eye
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              className="history-delete-button"
                              onClick={() =>
                                handleDelete(
                                  id
                                )
                              }
                              aria-label="Delete analysis"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </section>

            )}

          </main>

        </div>

      </main>

    </div>
  );
};

export default History;