import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loginApi, setAccessToken, type User } from "./api-client";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function logout() {
    if (expiryTimer.current !== null) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }

    setAccessToken(null);
    setUser(null);
  }

  useEffect(() => {
    return () => {
      if (expiryTimer.current !== null) {
        clearTimeout(expiryTimer.current);
      }
      setAccessToken(null);
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await loginApi(email, password);

    if (expiryTimer.current !== null) {
      clearTimeout(expiryTimer.current);
    }

    setAccessToken(result.token);
    setUser(result.user);

    expiryTimer.current = setTimeout(() => {
      logout();
    }, result.expiresIn * 1000);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
