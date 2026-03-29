import { signIn } from "@/auth"
import Link from "next/link"

function Logo({ size = 64, accent = "#7c6dff" }: { size?: number; accent?: string }) {
    return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
            <defs>
                <filter id="gl">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <g filter="url(#gl)" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round">
                <line x1="50" y1="8" x2="10" y2="85" />
                <line x1="50" y1="8" x2="90" y2="85" />
                <line x1="10" y1="85" x2="90" y2="85" />
                <line x1="50" y1="8" x2="50" y2="85" />
                <line x1="30" y1="47" x2="70" y2="47" />
            </g>
            <g filter="url(#gl)" fill={accent}>
                <circle cx="50" cy="8" r="3.5" />
                <circle cx="10" cy="85" r="3.5" />
                <circle cx="90" cy="85" r="3.5" />
                <circle cx="30" cy="47" r="2.5" />
                <circle cx="70" cy="47" r="2.5" />
                <circle cx="50" cy="85" r="2" />
            </g>
        </svg>
    )
}

export default function LoginPage() {
    return (
        <div style={{
            minHeight: "100vh", background: "#07070d",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", position: "relative", overflow: "hidden",
        }}>
            {/* Ambient glows */}
            <div style={{
                position: "absolute", width: "700px", height: "700px",
                top: "-200px", left: "50%", transform: "translateX(-50%)",
                background: "radial-gradient(circle, rgba(124,109,255,0.1) 0%, transparent 65%)",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", width: "400px", height: "400px",
                bottom: "-100px", right: "-100px",
                background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)",
                pointerEvents: "none",
            }} />

            {/* Back */}
            <Link href="/" style={{
                position: "absolute", top: "1.5rem", left: "1.75rem",
                fontSize: "0.65rem", color: "rgba(241,245,249,0.25)", fontWeight: 700,
                letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "0.4rem",
                transition: "color 0.2s",
            }}>
                ← biblehabit.co
            </Link>

            <div style={{ maxWidth: "400px", width: "100%", position: "relative", zIndex: 10 }}>
                {/* Card */}
                <div style={{
                    background: "#0e0e1a",
                    border: "1px solid rgba(124,109,255,0.18)",
                    padding: "2.75rem 2.25rem",
                    borderRadius: "24px",
                    boxShadow: "0 0 80px rgba(124,109,255,0.08), 0 8px 80px rgba(0,0,0,0.8)",
                    position: "relative", overflow: "hidden",
                }}>
                    {/* Top glow line */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(124,109,255,0.5), transparent)",
                    }} />

                    {/* Logo + brand */}
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "1rem",
                        marginBottom: "2rem", textAlign: "center",
                    }}>
                        <Logo size={60} accent="#7c6dff" />
                        <div>
                            <h1 style={{
                                fontSize: "1.5rem", fontWeight: 900, color: "#fff",
                                letterSpacing: "1.5px", margin: "0 0 0.3rem",
                            }}>
                                biblehabit.co
                            </h1>
                            <p style={{
                                color: "#7c6dff", fontSize: "0.58rem", fontWeight: 800,
                                letterSpacing: "2.5px", textTransform: "uppercase", opacity: 0.85,
                            }}>
                                AI works. You slack.
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: "1px", background: "rgba(255,255,255,0.05)",
                        margin: "0 0 1.75rem",
                    }} />

                    <p style={{
                        color: "rgba(241,245,249,0.45)", fontSize: "0.82rem",
                        textAlign: "center", marginBottom: "1.75rem", lineHeight: 1.7,
                    }}>
                        Sign in to access your{" "}
                        <span style={{ color: "#a78bfa" }}>client dashboard</span>{" "}
                        — track your services, deliverables, and reports.
                    </p>

                    {/* Google sign in */}
                    <form action={async () => {
                        "use server"
                        await signIn("google")
                    }}>
                        <button type="submit" style={{
                            width: "100%",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "13px", padding: "0.95rem 1.5rem",
                            color: "#f1f5f9", fontSize: "0.82rem", fontWeight: 700,
                            cursor: "pointer", letterSpacing: "0.3px",
                            transition: "background 0.2s, border-color 0.2s",
                        }}>
                            {/* Google icon */}
                            <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
                                <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                                <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                                <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                                <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        margin: "1.25rem 0",
                    }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
                        <span style={{ color: "rgba(241,245,249,0.2)", fontSize: "0.65rem", letterSpacing: "1px" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
                    </div>

                    {/* Email / Password sign in */}
                    <form action={async (formData: FormData) => {
                        "use server"
                        await signIn("credentials", {
                            email: formData.get("email"),
                            password: formData.get("password"),
                            redirectTo: "/dashboard",
                        })
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                                style={{
                                    width: "100%", padding: "0.85rem 1rem",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px", color: "#f1f5f9",
                                    fontSize: "0.82rem", outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                required
                                style={{
                                    width: "100%", padding: "0.85rem 1rem",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "10px", color: "#f1f5f9",
                                    fontSize: "0.82rem", outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <button type="submit" style={{
                                width: "100%", padding: "0.9rem",
                                background: "rgba(124,109,255,0.18)",
                                border: "1px solid rgba(124,109,255,0.35)",
                                borderRadius: "10px", color: "#c4b5fd",
                                fontSize: "0.82rem", fontWeight: 700,
                                cursor: "pointer", letterSpacing: "0.3px",
                                marginTop: "0.25rem",
                            }}>
                                Sign in with Email
                            </button>
                        </div>
                    </form>

                    <p style={{
                        textAlign: "center", fontSize: "0.6rem",
                        color: "rgba(241,245,249,0.15)", marginTop: "1.5rem", lineHeight: 1.7,
                    }}>
                        By signing in, you agree to our Terms of Service.<br />
                        New? You&apos;ll be guided through setup automatically.
                    </p>

                    {/* Footer bar */}
                    <div style={{
                        marginTop: "2rem", paddingTop: "1.25rem",
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <span style={{
                            fontSize: "0.55rem", color: "#7c6dff", letterSpacing: "3px",
                            textTransform: "uppercase", fontWeight: 900, opacity: 0.5,
                        }}>biblehabit.co</span>
                        <div style={{ display: "flex", gap: "5px" }}>
                            {[0, 150, 300].map(delay => (
                                <div key={delay} style={{
                                    width: "4px", height: "4px", background: "#7c6dff",
                                    borderRadius: "50%", opacity: 0.4,
                                    animation: `pulse-dot 1.8s ease-in-out ${delay}ms infinite`,
                                }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.3); }
        }
      `}</style>
        </div>
    )
}
