import { useState } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const [email, setEmail] = useState("admin@inventario.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.user, response.data.token);
      alert("¡Login Exitoso! Token guardado.");
    } catch {
      setError("Credenciales incorrectas o problema de conexión.");
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />

        {/* Geometric accent line */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 opacity-[0.03] pointer-events-none">
          <svg
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <polygon fill="white" points="0,200 100,0 200,200 300,50 400,200" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-lg">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md mb-8 shadow-2xl border border-white/20 ring-1 ring-white/10">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-black tracking-tight mb-4 drop-shadow-lg">
            SIGES
          </h1>

          {/* Subtitle with dividers */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8 bg-brand-400/60" />
            <span className="text-sm font-semibold text-brand-200 tracking-widest uppercase">
              Sistema de Gestión
            </span>
            <div className="h-px w-8 bg-brand-400/60" />
          </div>

          {/* Divider line */}
          <div className="w-16 h-1 bg-gradient-to-r from-brand-400 to-brand-300 mx-auto mb-6 rounded-full" />

          {/* Description */}
          <p className="text-brand-100/80 text-lg leading-relaxed font-light max-w-sm mx-auto">
            Mantén tus ingresos y egresos al día de manera eficiente, precisa y
            segura.
          </p>

          {/* Status badge */}
          <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-200 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Todos los sistemas operativos
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-50 via-brand-50/30 to-white relative">
        {/* Subtle dot pattern on right side */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #2563eb 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="w-full max-w-md relative">
          {/* Form card */}
          <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/70 ring-1 ring-black/[0.02]">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-50 mb-6 shadow-sm border border-brand-100">
                <svg
                  className="w-7 h-7 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
                Bienvenido de nuevo
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl mb-8 text-sm flex items-start gap-3 shadow-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <span className="font-semibold">Error de autenticación</span>
                  <p className="text-red-600/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 group-hover:border-slate-300"
                    placeholder="ejemplo@inventario.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 group-hover:border-slate-300"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 focus:ring-offset-0 transition cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-slate-600 font-medium cursor-pointer select-none"
                >
                  Recordar sesión
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  Iniciar Sesión
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-8">
            &copy; {new Date().getFullYear()} SIGES &mdash; Sistema de Gestión
            de Inventarios
          </p>
        </div>
      </div>
    </div>
  );
}
