import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/25 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-blue-950/40 lg:grid-cols-[1fr_1.05fr]">
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute inset-0 opacity-30">
            <div className="absolute -right-20 top-28 h-72 w-72 rounded-full border-[40px] border-white/20" />
            <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border-[52px] border-cyan-300/30" />
          </div>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/25 backdrop-blur">
              S
            </div>
            <p className="mt-7 text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">
              SupportDesk
            </p>
            <h1 className="mt-4 max-w-md text-5xl font-black leading-[1.08] tracking-tight">
              Great support starts with a conversation.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-blue-100">
              Keep every request, reply, and resolution in one calm, organized
              workspace.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Customers</p>
              <p className="mt-1 text-sm text-blue-100">Get help, stay updated</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Agents</p>
              <p className="mt-1 text-sm text-blue-100">Respond, resolve, repeat</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-black text-white shadow-lg shadow-blue-500/25">
                S
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">
                SupportDesk
              </p>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Sign in to your workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in with your account and we’ll open the right workspace.
              </p>
            </div>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white">
                ✓
              </span>
              <div>
                <p className="font-bold text-slate-900">Automatic account routing</p>
                <p className="mt-1 text-sm text-slate-600">
                  Your saved account role decides which workspace opens.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="mt-7 space-y-5"
            >
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    {...register("email", {
                      required: "Email is required.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address.",
                      },
                    })}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="mt-2 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    {...register("password", {
                      required: "Password is required.",
                    })}
                  />
                  {errors.password && (
                    <p id="password-error" role="alert" className="mt-2 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                Your account role and access are verified securely when you sign in.
              </p>
            </div>
        </section>
      </div>
    </main>
  );
}
