import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  GoogleLogin,
  type CredentialResponse,
} from "@react-oauth/google";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  googleLoginUser,
  loginUser,
} from "../services/authApi";

import "../styles/Auth.css";
import "../styles/GoogleLogin.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const TOKEN_KEY = "atsLensToken";
const USER_KEY = "atsLensUser";
const REMEMBER_EMAIL_KEY =
  "atsLensRememberEmail";

/* =========================================================
   LOGIN
========================================================= */

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     THEME
  ======================================================= */

  const [theme, setTheme] =
    useState<"dark" | "light">(
      () => {
        const current =
          document.documentElement
            .dataset.theme;

        return current === "light"
          ? "light"
          : "dark";
      }
    );

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;
  }, [theme]);

  /* =======================================================
     EXISTING AUTH
  ======================================================= */

  const existingToken =
    localStorage.getItem(
      TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      TOKEN_KEY
    );

  /* =======================================================
     REMEMBERED EMAIL
  ======================================================= */

  useEffect(() => {
    const remembered =
      localStorage.getItem(
        REMEMBER_EMAIL_KEY
      );

    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  /* =======================================================
     SAVE AUTH
  ======================================================= */

  const saveAuthData = (
    token: string,
    user: unknown
  ) => {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    sessionStorage.removeItem(
      TOKEN_KEY
    );

    sessionStorage.removeItem(
      USER_KEY
    );

    const userString =
      JSON.stringify(user);

    if (rememberMe) {
      localStorage.setItem(
        TOKEN_KEY,
        token
      );

      localStorage.setItem(
        USER_KEY,
        userString
      );
    } else {
      sessionStorage.setItem(
        TOKEN_KEY,
        token
      );

      sessionStorage.setItem(
        USER_KEY,
        userString
      );
    }
  };

  /* =======================================================
     NORMAL LOGIN
  ======================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await loginUser(
          cleanEmail,
          password
        );

      if (
        !response.success ||
        !response.token ||
        !response.user
      ) {
        setError(
          response.message ||
            "Unable to sign in."
        );

        return;
      }

      if (rememberMe) {
        localStorage.setItem(
          REMEMBER_EMAIL_KEY,
          cleanEmail
        );
      } else {
        localStorage.removeItem(
          REMEMBER_EMAIL_KEY
        );
      }

      saveAuthData(
        response.token,
        response.user
      );

      navigate("/", {
        replace: true,
      });
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Network Error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     GOOGLE LOGIN
  ======================================================= */

  const handleGoogleSuccess =
    async (
      credentialResponse:
        CredentialResponse
    ) => {
      if (loading) {
        return;
      }

      setError("");

      const credential =
        credentialResponse.credential;

      if (!credential) {
        setError(
          "Google sign in failed."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await googleLoginUser(
            credential
          );

        if (
          !response.success ||
          !response.token ||
          !response.user
        ) {
          setError(
            response.message ||
              "Google sign in failed."
          );

          return;
        }

        if (
          rememberMe &&
          response.user.email
        ) {
          localStorage.setItem(
            REMEMBER_EMAIL_KEY,
            response.user.email
          );
        }

        if (!rememberMe) {
          localStorage.removeItem(
            REMEMBER_EMAIL_KEY
          );
        }

        saveAuthData(
          response.token,
          response.user
        );

        navigate("/", {
          replace: true,
        });
      } catch (googleError) {
        console.error(
          "Google login error:",
          googleError
        );

        setError(
          googleError instanceof Error
            ? googleError.message
            : "Network Error"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleGoogleError =
    () => {
      setError(
        "Google sign in was not completed."
      );
    };

  /* =======================================================
     ALREADY LOGGED IN
  ======================================================= */

  if (existingToken) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="auth-page">
      {/* ===============================================
          BACKGROUND ANIMATION
      =============================================== */}

      <div
        className="auth-background-animation"
        aria-hidden="true"
      >
        <span className="auth-bg-orb orb-1" />
        <span className="auth-bg-orb orb-2" />
        <span className="auth-bg-orb orb-3" />
        <span className="auth-bg-orb orb-4" />

        <span className="auth-bg-line line-1" />
        <span className="auth-bg-line line-2" />
        <span className="auth-bg-line line-3" />
      </div>

      {/* ===============================================
          THEME
      =============================================== */}

      <button
        type="button"
        className="auth-theme-button"
        aria-label="Change theme"
        onClick={() =>
          setTheme(
            theme === "dark"
              ? "light"
              : "dark"
          )
        }
      >
        {theme === "dark"
          ? "☀"
          : "☾"}
      </button>

      {/* ===============================================
          MAIN SHELL
      =============================================== */}

      <section className="auth-shell">
        {/* =============================================
            LEFT VISUAL
        ============================================= */}

        <div className="auth-visual">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              {/* ATS Lens icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 3H5a2 2 0 0 0-2 2v2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M17 3h2a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M7 21H5a2 2 0 0 1-2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M17 21h2a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <circle
                  cx="12"
                  cy="10"
                  r="2.3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <path
                  d="M8.7 16c.8-1.6 1.9-2.4 3.3-2.4s2.5.8 3.3 2.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
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

          <div className="auth-visual-content">
            <span className="auth-kicker">
              RESUME INTELLIGENCE
            </span>

            <h1>
              See your
              <br />
              resume
              <br />
              through an ATS
              <br />
              lens.
            </h1>

            <p>
              Analyze ATS
              compatibility,
              identify missing
              skills, understand
              resume risks, and
              improve your
              application with
              evidence-based
              insights.
            </p>
          </div>

          <div className="auth-visual-footer">
            AI-powered resume
            intelligence for
            better applications.
          </div>
        </div>

        {/* =============================================
            RIGHT PANEL
        ============================================= */}

        <div className="auth-panel">
          <div className="auth-form-wrap">
            {/* =========================================
                HEADING
            ========================================= */}

            <div className="auth-form-heading">
              <span>
                WELCOME BACK
              </span>

              <h2>
                Sign in to ATS Lens
              </h2>

              <p>
                Continue your
                resume analysis
                workspace.
              </p>
            </div>

            {/* =========================================
                ERROR
            ========================================= */}

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =========================================
                GOOGLE LOGIN
            ========================================= */}

            <div className="auth-google-wrap">
              <GoogleLogin
                onSuccess={
                  handleGoogleSuccess
                }
                onError={
                  handleGoogleError
                }
                theme="filled_black"
                size="large"
                shape="rectangular"
                text="continue_with"
                width="400"
                useOneTap={false}
              />
            </div>

            {/* =========================================
                OR
            ========================================= */}

            <div className="auth-divider">
              <span>
                OR
              </span>
            </div>

            {/* =========================================
                FORM
            ========================================= */}

            <form
              className="auth-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              {/* EMAIL */}

              <div className="auth-field">
                <label
                  htmlFor="email"
                >
                  Email Address
                </label>

                <div className="auth-input-wrap">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />

                    <path
                      d="m4 7 8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    id="email"
                    type="email"
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    disabled={
                      loading
                    }
                    onChange={(
                      event
                    ) => {
                      setEmail(
                        event
                          .target
                          .value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="auth-field">
                <label
                  htmlFor="password"
                >
                  Password
                </label>

                <div className="auth-input-wrap">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />

                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    disabled={
                      loading
                    }
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event
                          .target
                          .value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                  >
                    {showPassword
                      ? "◉"
                      : "◎"}
                  </button>
                </div>
              </div>

              {/* OPTIONS */}

              <div className="auth-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    disabled={
                      loading
                    }
                    onChange={(
                      event
                    ) =>
                      setRememberMe(
                        event
                          .target
                          .checked
                      )
                    }
                  />

                  <span className="remember-toggle" />

                  <span>
                    Remember Me
                  </span>
                </label>
              </div>

              {/* SIGN IN */}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>
            </form>

            {/* =========================================
                REGISTER
            ========================================= */}

            <div className="auth-switch">
              <span>
                Don&apos;t have
                an account?
              </span>

              <Link to="/register">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;