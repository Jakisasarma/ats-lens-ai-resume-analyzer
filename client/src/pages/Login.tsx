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

const TOKEN_KEY = "atsLensToken";
const USER_KEY = "atsLensUser";
const REMEMBER_EMAIL_KEY =
  "atsLensRememberEmail";

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

  const [theme, setTheme] =
    useState<"dark" | "light">(
      () => {
        const savedTheme =
          localStorage.getItem(
            "atsLensTheme"
          );

        if (
          savedTheme === "light" ||
          savedTheme === "dark"
        ) {
          return savedTheme;
        }

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

    localStorage.setItem(
      "atsLensTheme",
      theme
    );
  }, [theme]);

  const existingToken =
    localStorage.getItem(
      TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      TOKEN_KEY
    );

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem(
        REMEMBER_EMAIL_KEY
      );

    if (rememberedEmail) {
      setEmail(
        rememberedEmail
      );

      setRememberMe(true);
    }
  }, []);

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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

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
        "Google sign in was not completed. Please try again."
      );
    };

  if (existingToken) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <main className="auth-page">
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

      <section className="auth-shell">
        <div className="auth-visual">
          <div className="auth-brand">
            <div className="auth-brand-icon">
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
        </div>

        <div className="auth-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <span>
                WELCOME BACK
              </span>

              <h2>
                Sign in to ATS Lens
              </h2>

              <p>
                Continue your resume
                analysis workspace.
              </p>
            </div>

            {error && (
              <div
                className="auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =========================================
                PREMIUM GOOGLE BUTTON
            ========================================= */}

            <div className="premium-google-button">
              <div className="premium-google-content">
                <div className="premium-google-logo">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 4.98-.9 6.64-2.38l-3.24-2.53c-.9.6-2.05.96-3.4.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.61A10 10 0 0 0 12 22Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.47H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.53l3.35-2.61Z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.88-2.88C16.97 2.95 14.7 2 12 2a10 10 0 0 0-8.94 5.47l3.35 2.61C7.2 7.71 9.4 5.95 12 5.95Z"
                    />
                  </svg>
                </div>

                <div className="premium-google-copy">
                  <strong>
                    Continue with Google
                  </strong>

                  <span>
                    Secure sign in with your
                    Google account
                  </span>
                </div>

                <div className="premium-google-arrow">
                  →
                </div>
              </div>

              {/* Real Google sign-in layer */}
              <div className="google-native-click-layer">
                <GoogleLogin
                  onSuccess={
                    handleGoogleSuccess
                  }
                  onError={
                    handleGoogleError
                  }
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                  width="400"
                  useOneTap={false}
                />
              </div>
            </div>

            <div className="auth-divider">
              <span>
                OR
              </span>
            </div>

            <form
              className="auth-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              <div className="auth-field">
                <label
                  htmlFor="email"
                >
                  Email Address
                </label>

                <div className="auth-input-wrap">
                  <span>
                    ✉
                  </span>

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
                        event.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label
                  htmlFor="password"
                >
                  Password
                </label>

                <div className="auth-input-wrap">
                  <span>
                    ♙
                  </span>

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
                        event.target.value
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
                        (current) =>
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

            <div className="auth-switch">
              <span>
                Don&apos;t have an
                account?
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