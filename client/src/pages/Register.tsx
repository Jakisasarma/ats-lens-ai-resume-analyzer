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
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  registerUser,
} from "../services/authApi";

import {
  useTheme,
} from "../context/ThemeContext";

import "../styles/Auth.css";

const Register = () => {
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
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =========================================================
     REGISTER
  ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      if (
        password.length < 6
      ) {
        setError(
          "Password must contain at least 6 characters."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await registerUser(
            normalizedEmail,
            password
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Registration failed."
          );
        }

        setSuccess(
          "Account created successfully."
        );

        window.setTimeout(
          () => {
            navigate(
              "/login",
              {
                replace: true,
              }
            );
          },
          900
        );
      } catch (err: any) {
        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to create account."
        );
      } finally {
        setLoading(false);
      }
    };

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
          <Sun
            size={18}
          />
        ) : (
          <Moon
            size={18}
          />
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
              Build a stronger
              application.
            </h1>

            <p>
              Create your ATS Lens
              account to analyze your
              resume, check ATS
              compatibility, identify
              missing skills and improve
              your application before you
              apply.
            </p>

          </div>

          <div className="auth-visual-footer">

            AI-powered resume
            intelligence for better
            applications.

          </div>

        </section>

        {/* ===================================================
            RIGHT REGISTER PANEL
        ==================================================== */}

        <section className="auth-panel">

          <div className="auth-form-wrap">

            <div className="auth-form-heading">

              <span>
                Create Account
              </span>

              <h2>
                Get started with ATS Lens
              </h2>

              <p>
                Create your account and
                start analyzing your
                resume.
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

            {/* SUCCESS */}

            {success && (
              <div
                className="auth-message"
                role="status"
              >
                {success}
              </div>
            )}

            {/* REGISTER FORM */}

            <form
              className="auth-form"
              onSubmit={
                handleSubmit
              }
              autoComplete="off"
            >

              {/* EMAIL */}

              <div className="auth-field">

                <label
                  htmlFor="register-email"
                >
                  Email Address
                </label>

                <div className="auth-input-wrap">

                  <Mail
                    size={17}
                  />

                  <input
                    id="register-email"
                    name="ats-lens-register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={
                      loading
                    }
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="auth-field">

                <label
                  htmlFor="register-password"
                >
                  Password
                </label>

                <div className="auth-input-wrap">

                  <LockKeyhole
                    size={17}
                  />

                  <input
                    id="register-password"
                    name="ats-lens-register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    minLength={6}
                    disabled={
                      loading
                    }
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
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

              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                className="auth-submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>

            </form>

            {/* LOGIN LINK */}

            <div className="auth-switch">

              <span>
                Already have an account?
              </span>

              <Link
                to="/login"
              >
                Sign In
              </Link>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Register;