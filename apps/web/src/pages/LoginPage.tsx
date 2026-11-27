import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api-client";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: LoginForm) {
    setServerError("");

    try {
      await login(values.email.trim().toLowerCase(), values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "INVALID_CREDENTIALS") {
          setServerError("Invalid email or password.");
        } else if (error.code === "NETWORK_ERROR") {
          setServerError("Cannot connect to the server. Please try again.");
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <main className="login-screen">
      <div className="login-layout">
        <section className="login-intro" aria-labelledby="login-brand-heading">
          <div className="login-brand">
            <span aria-hidden="true" className="login-brand-mark">S</span>
            <span>SupportDesk</span>
          </div>

          <svg
            aria-hidden="true"
            className="support-illustration"
            viewBox="0 0 480 270"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="238" cy="134" r="112" fill="#EDE9FE" />
            <circle cx="238" cy="134" r="90" stroke="#C4B5FD" strokeWidth="2" strokeDasharray="5 8" />
            <path d="M142 184c18-21 39-30 65-30h61c29 0 51 9 69 30v28H142v-28Z" fill="#C4B5FD" />
            <rect x="176" y="58" width="157" height="112" rx="18" fill="white" stroke="#DDD6FE" strokeWidth="3" />
            <path d="M197 85h115M197 103h78M197 121h93" stroke="#A78BFA" strokeWidth="8" strokeLinecap="round" />
            <circle cx="302" cy="153" r="17" fill="#7C3AED" />
            <path d="m295 153 5 5 10-11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="136" cy="128" r="30" fill="#F3EEFF" stroke="#DDD6FE" strokeWidth="3" />
            <path d="M123 127c0-7 6-13 13-13s13 6 13 13v11h-7l-6-5-6 5h-7v-11Z" fill="#8B5CF6" />
            <path d="M119 126v-3a17 17 0 0 1 34 0v3M119 127h5v11h-5a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4ZM153 127h-5v11h5a4 4 0 0 0 4-4v-3a4 4 0 0 0-4-4Z" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="355" cy="82" r="18" fill="#DDD6FE" />
            <path d="M348 82h14M355 75v14" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
            <circle cx="353" cy="192" r="7" fill="#A78BFA" />
            <circle cx="164" cy="62" r="6" fill="#C4B5FD" />
          </svg>

          <div className="login-copy">
            <h1 id="login-brand-heading">Great support starts with a conversation.</h1>
            <p>
              Keep every request, reply, and resolution in one calm, organized
              workspace.
            </p>
          </div>

          <div className="login-audience">
            <article>
              <strong>Customers</strong>
              <p>Get help, stay updated</p>
            </article>
            <article>
              <strong>Agents</strong>
              <p>Respond, resolve, repeat</p>
            </article>
          </div>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <header>
            <p className="login-eyebrow">Welcome back</p>
            <h2 id="login-title">Sign in to your workspace</h2>
            <p className="login-card-intro">
              Sign in with your account and we’ll open the right workspace.
            </p>
          </header>

          <div className="login-routing">
            <span className="login-routing-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Automatic account routing</strong>
              <p>Your saved account role decides which workspace opens.</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="login-form"
          >
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required.",
              })}
            />

            {serverError && (
              <p role="alert" className="login-server-error">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              className="login-submit"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="login-verification">
            Your account role and access are verified securely when you sign in.
          </p>
        </section>
      </div>
    </main>
  );
}
