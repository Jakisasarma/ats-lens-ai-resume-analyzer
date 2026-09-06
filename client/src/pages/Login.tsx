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
   LOGIN PAGE
========================================================= */

const Login = () => {
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

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

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     CHECK EXISTING LOGIN
  ======================================================= */

  const existingToken =
    localStorage.getItem(
      TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      TOKEN_KEY
    );

  /* =======================================================
     LOAD REMEMBERED EMAIL
  ======================================================= */

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem(
        REMEMBER_EMAIL_KEY
      );

    if (rememberedEmail) {
      setEmail(
        rememberedEmail
      );

      setRememberMe(
        true
      );
    }
  }, []);

  /* =======================================================
     SAVE AUTH DATA
  ======================================================= */

  const saveAuthData = (
    token: string,
    user: unknown
  ) => {
    /*
      Remove old auth data first
      so local/session storage
      never conflict.
    */

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

    /*
      Remember Me ON:
      browser close/open செய்தாலும்
      login stay ஆகும்.
    */

    if (rememberMe) {
      localStorage.setItem(
        TOKEN_KEY,
        token
      );

      localStorage.setItem(
        USER_KEY,
        userString
      );

      return;
    }

    /*
      Remember Me OFF:
      current browser session மட்டும்.
    */

    sessionStorage.setItem(
      TOKEN_KEY,
      token
    );

    sessionStorage.setItem(
      USER_KEY,
      userString
    );
  };

  /* =======================================================
     NORMAL EMAIL LOGIN
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

      /*
        Remember email separately.
      */

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

      navigate(
        "/",
        {
          replace: true,
        }
      );
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
     GOOGLE LOGIN SUCCESS
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
          "Google sign in did not return a valid credential."
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

        /*
          If Google user has an email
          and Remember Me is enabled,
          remember that email too.
        */

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

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (
        googleError
      ) {
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

  /* =======================================================
     GOOGLE LOGIN ERROR
  ======================================================= */

  const handleGoogleError =
    () => {
      setError(
        "Google sign in was not completed. Please try again."
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
      <section className="auth-shell">
        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="auth-brand-panel">
          <div className="auth-brand-top">
            <div className="auth-brand-logo">
              <div className="auth-brand-icon">
                <span>
                  ⌗
                </span>
              </div>

              <div>
                <h2>
                  ATS LENS
                </h2>

                <p>
                  AI Resume Analyzer
                </p>
              </div>
            </div>
          </div>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
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

          <div className="auth-brand-footer">
            AI-powered resume
            intelligence for
            better applications.
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-heading">
              <span className="auth-eyebrow">
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

            {/* =============================================
                ERROR MESSAGE
            ============================================= */}

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* =============================================
                GOOGLE LOGIN
            ============================================= */}

            <div className="google-login-animated">
              <div className="google-login-inner">
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
                  width="420"
                  useOneTap={false}
                  cancel_on_tap_outside={
                    true
                  }
                />
              </div>
            </div>

            {/* =============================================
                DIVIDER
            ============================================= */}

            <div className="auth-divider">
              <span />
              <p>
                OR
              </p>
              <span />
            </div>

            {/* =============================================
                LOGIN FORM
            ============================================= */}

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
                  htmlFor="login-email"
                >
                  Email Address
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    ✉
                  </span>

                  <input
                    id="login-email"
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

                      if (
                        error
                      ) {
                        setError(
                          ""
                        );
                      }
                    }}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="auth-field">
                <label
                  htmlFor="login-password"
                >
                  Password
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    ♙
                  </span>

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={
                      password
                    }
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

                      if (
                        error
                      ) {
                        setError(
                          ""
                        );
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

              {/* REMEMBER ME */}

              <label className="auth-remember">
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

                <span className="auth-toggle">
                  <span />
                </span>

                <span className="auth-remember-text">
                  Remember Me
                </span>
              </label>

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

            {/* =============================================
                REGISTER LINK
            ============================================= */}

            <div className="auth-bottom-link">
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