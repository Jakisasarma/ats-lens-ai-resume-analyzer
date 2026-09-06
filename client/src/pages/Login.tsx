import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  GoogleLogin,
} from "@react-oauth/google";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ScanSearch,
  Sun,
} from "lucide-react";

import {
  googleLoginUser,
  loginUser,
} from "../services/authApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Auth.css";
import "../styles/GoogleLogin.css";

const Login = () => {
  const navigate =
    useNavigate();

  const {
    theme,
    toggleTheme,
  } = useTheme();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     EXISTING AUTH
  ========================================================= */

  const existingToken =
    localStorage.getItem(
      "atsLensToken"
    ) ||
    sessionStorage.getItem(
      "atsLensToken"
    );

  /* =========================================================
     LOAD REMEMBERED EMAIL
  ========================================================= */

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem(
        "atsLensRememberEmail"
      );

    if (rememberedEmail) {
      setEmail(
        rememberedEmail
      );

      setRememberMe(true);
    }
  }, []);

  /* =========================================================
     SAVE AUTH DATA
  ========================================================= */

  const saveAuthData = (
    token: string,
    user: unknown
  ) => {
    const userValue =
      JSON.stringify(
        user ?? {}
      );

    if (rememberMe) {
      localStorage.setItem(
        "atsLensToken",
        token
      );

      localStorage.setItem(
        "atsLensUser",
        userValue
      );

      sessionStorage.removeItem(
        "atsLensToken"
      );

      sessionStorage.removeItem(
        "atsLensUser"
      );
    } else {
      sessionStorage.setItem(
        "atsLensToken",
        token
      );

      sessionStorage.setItem(
        "atsLensUser",
        userValue
      );

      localStorage.removeItem(
        "atsLensToken"
      );

      localStorage.removeItem(
        "atsLensUser"
      );
    }
  };

  /* =========================================================
     NORMAL LOGIN
  ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      try {
        setLoading(true);
        setError("");

        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        if (
          !normalizedEmail ||
          !password.trim()
        ) {
          setError(
            "Please enter your email and password."
          );

          return;
        }

        const response =
          await loginUser(
            normalizedEmail,
            password
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Login failed."
          );
        }

        if (!response.token) {
          throw new Error(
            "Authentication token was not returned."
          );
        }

        saveAuthData(
          response.token,
          response.user
        );

        if (rememberMe) {
          localStorage.setItem(
            "atsLensRememberEmail",
            normalizedEmail
          );
        } else {
          localStorage.removeItem(
            "atsLensRememberEmail"
          );
        }

        /* LOGIN -> HOMEPAGE */

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err: any) {
        console.error(
          "Login error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to login. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleSuccess =
    async (
      credentialResponse: any
    ) => {
      try {
        setLoading(true);
        setError("");

        const credential =
          credentialResponse
            ?.credential;

        if (!credential) {
          throw new Error(
            "Google credential not received."
          );
        }

        const response =
          await googleLoginUser(
            credential
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Google login failed."
          );
        }

        if (!response.token) {
          throw new Error(
            "Authentication token was not returned."
          );
        }

        saveAuthData(
          response.token,
          response.user
        );

        /* GOOGLE LOGIN -> HOMEPAGE */

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (err: any) {
        console.error(
          "Google login error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Google login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     ALREADY LOGGED IN
  ========================================================= */

  if (existingToken) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <div className="auth-page">

      {/* =====================================================
          BACKGROUND ANIMATION
      ====================================================== */}

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

      {/* =====================================================
          THEME BUTTON
      ====================================================== */}

      <button
        type="button"
        className="auth-theme-button"
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

      {/* =====================================================
          AUTH SHELL
      ====================================================== */}

      <div className="auth-shell">

        {/* ===================================================
            LEFT PANEL
        ==================================================== */}

        <section className="auth-visual">

          <div className="auth-brand">

            <div className="auth-brand-icon">

              <ScanSearch
                size={23}
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

          <div className="auth-visual-content">

            <span className="auth-kicker">
              Resume Intelligence
            </span>

            <h1>
              See your resume
              through an ATS lens.
            </h1>

            <p>
              Analyze ATS compatibility,
              identify missing skills,
              understand resume risks,
              and improve your application
              with evidence-based insights.
            </p>

          </div>

          <div className="auth-visual-footer">

            AI-powered resume
            intelligence for better
            applications.

          </div>

        </section>

        {/* ===================================================
            RIGHT LOGIN PANEL
        ==================================================== */}

        <section className="auth-panel">

          <div className="auth-form-wrap">

            <div className="auth-form-heading">

              <span>
                Welcome Back
              </span>

              <h2>
                Sign in to ATS Lens
              </h2>

              <p>
                Continue your resume
                analysis workspace.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =================================================
                GOOGLE LOGIN
            ================================================== */}

            <div className="google-login-animated">

              <div className="google-login-inner">

                <GoogleLogin
                  onSuccess={
                    handleGoogleSuccess
                  }
                  onError={() =>
                    setError(
                      "Google login failed. Please try again."
                    )
                  }
                  useOneTap={false}
                  theme={
                    theme === "dark"
                      ? "filled_black"
                      : "outline"
                  }
                  size="large"
                  shape="rectangular"
                  text="signin_with"
                />

              </div>

            </div>

            {/* =================================================
                DIVIDER
            ================================================== */}

            <div className="auth-divider">

              <span>
                OR
              </span>

            </div>

            {/* =================================================
                LOGIN FORM
            ================================================== */}

            <form
              className="auth-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* =================================================
                  EMAIL
              ================================================== */}

              <div className="auth-field">

                <label
                  htmlFor="ats-lens-email"
                >
                  Email Address
                </label>

                <div className="auth-input-wrap">

                  <Mail
                    size={17}
                  />

                  <input
                    id="ats-lens-email"
                    name="username"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="Enter your email"
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={
                      loading
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  PASSWORD
              ================================================== */}

              <div className="auth-field">

                <label
                  htmlFor="ats-lens-password"
                >
                  Password
                </label>

                <div className="auth-input-wrap">

                  <LockKeyhole
                    size={17}
                  />

                  <input
                    id="ats-lens-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={
                      loading
                    }
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>

                </div>

              </div>

              {/* =================================================
                  REMEMBER ME
              ================================================== */}

              <div className="auth-options">

                <label className="remember-option">

                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                  />

                  <span className="remember-toggle" />

                  <span>
                    Remember Me
                  </span>

                </label>

              </div>

              {/* =================================================
                  SIGN IN
              ================================================== */}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

            </form>

            {/* =================================================
                CREATE ACCOUNT
            ================================================== */}

            <div className="auth-switch">

              <span>
                Don't have an account?
              </span>

              <button
                type="button"
                className="auth-link-button"
                onClick={() =>
                  navigate(
                    "/register"
                  )
                }
              >
                Create Account
              </button>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Login;