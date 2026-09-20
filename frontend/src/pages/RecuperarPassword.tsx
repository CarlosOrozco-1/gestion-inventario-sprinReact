import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import SuccessModal from "../components/SuccessModal";

type Paso = "email" | "codigo" | "restablecer";

export default function RecuperarPassword() {
  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const navigate = useNavigate();

  const pasoIndex = paso === "email" ? 0 : paso === "codigo" ? 1 : 2;
  const pasos = ["Correo", "Código", "Nueva contraseña"];

  const solicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api.post("/auth/recuperar", { email });
      setInfo("Si el correo está registrado, recibirás un código de 6 dígitos.");
      setPaso("codigo");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo enviar el código. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api.post("/auth/verificar-codigo", { email, codigo });
      setInfo("");
      setPaso("restablecer");
    } catch (err: any) {
      setError(err.response?.data?.message || "Código inválido o expirado.");
    } finally {
      setCargando(false);
    }
  };

  const restablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    try {
      await api.post("/auth/restablecer", { email, codigo, nuevaPassword: password });
      setExito(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="text-6xl font-black tracking-tight mb-4 drop-shadow-lg">SIGES</h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8 bg-brand-400/60" />
            <span className="text-sm font-semibold text-brand-200 tracking-widest uppercase">Recuperación de contraseña</span>
            <div className="h-px w-8 bg-brand-400/60" />
          </div>
          <p className="text-brand-100/80 text-lg leading-relaxed font-light max-w-sm mx-auto">
            Recupera el acceso a tu cuenta de manera segura en tres simples pasos.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50/40 relative">
        <div className="w-full max-w-md relative">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {pasos.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${i <= pasoIndex ? "bg-brand-500" : "bg-slate-300"}`} />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i <= pasoIndex ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`hidden sm:block text-xs font-semibold ${i <= pasoIndex ? "text-brand-700" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/60 ring-1 ring-black/[0.02]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
                {paso === "email" && "¿Olvidaste tu contraseña?"}
                {paso === "codigo" && "Ingresa el código"}
                {paso === "restablecer" && "Nueva contraseña"}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {paso === "email" && "Ingresa tu correo y te enviaremos un código"}
                {paso === "codigo" && `Enviamos el código al correo ${email}`}
                {paso === "restablecer" && "Define una nueva contraseña para tu cuenta"}
              </p>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm shadow-sm">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}
            {info && (
              <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm shadow-sm">
                {info}
              </div>
            )}

            {paso === "email" && (
              <form onSubmit={solicitarCodigo} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    placeholder="tucorreo@ejemplo.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] disabled:opacity-60"
                >
                  {cargando ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            )}

            {paso === "codigo" && (
              <form onSubmit={verificarCodigo} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Código de verificación</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    placeholder="······"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] disabled:opacity-60"
                >
                  {cargando ? "Verificando..." : "Verificar código"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPaso("email"); setInfo(""); }}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  ← Cambiar correo
                </button>
              </form>
            )}

            {paso === "restablecer" && (
              <form onSubmit={restablecer} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nueva contraseña</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmacion}
                      onChange={(e) => setConfirmacion(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 pr-12"
                      placeholder="Repite la contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-brand-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] disabled:opacity-60"
                >
                  {cargando ? "Guardando..." : "Restablecer contraseña"}
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                ← Volver a iniciar sesión
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            &copy; {new Date().getFullYear()} SIGES &mdash; Sistema de Gestión de Inventarios
          </p>
        </div>
      </div>

      <SuccessModal
        isOpen={exito}
        title="Contraseña actualizada"
        message="Ya puedes iniciar sesión con tu nueva contraseña."
        buttonText="Iniciar sesión"
        onClose={() => navigate("/login")}
      />
    </div>
  );
}
