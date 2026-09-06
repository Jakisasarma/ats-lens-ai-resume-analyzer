import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

export interface AuthUser {
  id?: string;
  _id?: string;

  name?: string;
  email: string;

  avatar?: string | null;

  authProvider?:
    | "local"
    | "google";

  isActive?: boolean;
}

export interface AuthResponse {
  success: boolean;

  message?: string;

  token?: string;

  user?: AuthUser;
}

/* =========================================================
   REGISTER
========================================================= */

export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response =
    await axios.post<AuthResponse>(
      `${API_URL}/auth/register`,
      {
        email,
        password,
      }
    );

  return response.data;
};

/* =========================================================
   LOGIN
========================================================= */

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response =
    await axios.post<AuthResponse>(
      `${API_URL}/auth/login`,
      {
        email,
        password,
      }
    );

  return response.data;
};

/* =========================================================
   GOOGLE LOGIN
========================================================= */

export const googleLoginUser = async (
  credential: string
): Promise<AuthResponse> => {
  const response =
    await axios.post<AuthResponse>(
      `${API_URL}/auth/google`,
      {
        credential,
      }
    );

  return response.data;
};