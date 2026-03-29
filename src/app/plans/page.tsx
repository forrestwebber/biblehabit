'use client';

import { useState } from 'react';

const PLANS = [
  {
    id: 'essentials',
    name: 'AGENT ESSENTIALS',
    price: 499,
    description: 'Everything a real estate agent needs to start generating leads and closing deals online.',
    highlight: false,
    features: [
      'Professional website + landing pages',
      'Google Business Profile optimization',
      'Monthly SEO blog content (4 posts)',
      'Social media management (8 posts/mo)',
      'Lead capture forms + CRM setup',
      'Monthly performance report',
      'Email support (24h response)',
    ],
    cta: 'Get Started',
  },
  {
    id: 'growth',
    name: 'AGENT GROWTH',
    price: 999,
    description: 'Full-stack AI-powered marketing for agents ready to dominate their market and scale fast.',
    highlight: true,
    features: [
      'Everything in Essentials',
      '8 SEO blog posts per month',
      '16 social posts per month',
      'Google & Facebook ad management',
      'Email drip campaigns + nurture sequences',
      'AI-powered listing descriptions',
      'Weekly strategy calls',
      'Priority support (same-day)',
      'Competitor analysis + market reports',
      'Video content creation',
    ],
    cta: 'Get Growth Plan',
  },
];

const STATS = [
  { value: '$40-50K/mo', label: 'Revenue from 20 websites' },
  { value: '50', label: 'Person team managed' },
  { value: '275K', label: 'Words produced monthly' },
  { value: '13M+', label: 'Words total' },
];

export default function PlansPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailModal, setEmailModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setError(null);
    if (!email.trim()) {
      setEmailModal(planId);
      return;
    }
    await startCheckout(planId, email);
  };

  const startCheckout = async (planId: string, userEmail: string) => {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email: userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !emailModal) return;
    setEmailModal(null);
    await startCheckout(emailModal, email);
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        padding: '0 0 0',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          top: '-40%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '900px',
          background: 'radial-gradient(circle, rgba(124,109,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header Section */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '80px 24px 0',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            borderRadius: 100,
            padding: '7px 18px',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
            }}
          >
            AI WORKS. YOU SLACK.
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(34px, 5.5vw, 58px)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            marginBottom: 18,
          }}
        >
          Simple, transparent pricing
        </h1>

        <p
          style={{
            fontSize: 17,
            color: 'var(--text-muted)',
            maxWidth: 540,
            margin: '0 auto 40px',
            lineHeight: 1.65,
          }}
        >
          Pick a plan. Our AI-powered team handles everything — websites, SEO, ads, content — while you focus on closing deals.
        </p>

        {/* Email Input */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '13px 20px',
              fontSize: 15,
              color: 'var(--text)',
              outline: 'none',
              width: 300,
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-border)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <span
            style={{
              color: 'var(--text-dim)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Enter your email, then pick a plan below
          </span>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            maxWidth: 500,
            margin: '0 auto 28px',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.25)',
            borderRadius: 12,
            padding: '13px 18px',
            fontSize: 14,
            color: '#f43f5e',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 860,
          margin: '0 auto',
          padding: '40px 24px 64px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: plan.highlight
                  ? '1px solid var(--accent-border)'
                  : '1px solid var(--border)',
                borderRadius: 22,
                padding: plan.highlight ? '40px 32px 36px' : '36px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.highlight
                  ? '0 0 60px rgba(124,109,255,0.12), 0 0 120px rgba(124,109,255,0.05)'
                  : 'none',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                transform: plan.highlight ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Most Popular badge */}
              {plan.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--accent), #9b8aff)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    padding: '5px 16px',
                    borderRadius: 100,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 20px rgba(124,109,255,0.3)',
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              {/* Tier name */}
              <div style={{ marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: plan.highlight ? 'var(--accent)' : 'var(--text-dim)',
                  }}
                >
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    background: plan.highlight
                      ? 'linear-gradient(135deg, var(--text), var(--accent))'
                      : 'none',
                    WebkitBackgroundClip: plan.highlight ? 'text' : undefined,
                    WebkitTextFillColor: plan.highlight ? 'transparent' : undefined,
                  }}
                >
                  ${plan.price}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: 'var(--text-dim)',
                    marginLeft: 4,
                    fontWeight: 500,
                  }}
                >
                  /mo
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: 28,
                  minHeight: 44,
                }}
              >
                {plan.description}
              </p>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'var(--border)',
                  marginBottom: 24,
                }}
              />

              {/* Feature list */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                  flex: 1,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--green)',
                        flexShrink: 0,
                        marginTop: 1,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      &#10003;
                    </span>
                    <span style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                style={{
                  background: plan.highlight
                    ? 'linear-gradient(135deg, var(--accent), #9b8aff)'
                    : 'transparent',
                  color: plan.highlight ? '#fff' : 'var(--accent)',
                  border: plan.highlight ? 'none' : '1px solid var(--accent-border)',
                  borderRadius: 14,
                  padding: '15px 24px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                  opacity: loading === plan.id ? 0.6 : 1,
                  transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
                  width: '100%',
                  boxShadow: plan.highlight
                    ? '0 4px 24px rgba(124,109,255,0.25)'
                    : 'none',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  if (loading !== plan.id) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    if (!plan.highlight) {
                      e.currentTarget.style.background = 'var(--accent-dim)';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!plan.highlight) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {loading === plan.id ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 40,
            color: 'var(--text-dim)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          No contracts. Cancel anytime. Powered by Stripe.
        </p>
      </section>

      {/* About Forrest */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid var(--border)',
          padding: '80px 24px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(124,109,255,0.02) 100%)',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 12,
              }}
            >
              The Founder
            </span>
            <h2
              style={{
                fontSize: 'clamp(26px, 4vw, 38px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              Built by someone who&apos;s done it at scale
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Forrest Webber built and scaled a content operation that most agencies only dream about.
            </p>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              background: 'var(--border)',
              borderRadius: 18,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              marginBottom: 48,
            }}
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '28px 20px',
                  background: 'var(--bg-card)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(20px, 2.5vw, 28px)',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-dim)',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Bio + press */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '32px 28px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  FW
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Forrest Webber</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>
                    Founder, Slacked.co
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                }}
              >
                Forrest built and managed a 50-person content team producing 275K words per month across 20+ websites generating $40-50K/mo in revenue. Over 13M+ words published. Now he&apos;s packaging that entire system — powered by AI — and delivering it as a service.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '32px 28px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 24,
                }}
              >
                Featured In
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <a
                  href="https://www.starterstory.com/stories/forrest-webber"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                      Starter Story
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Full founder interview and business breakdown
                    </div>
                  </div>
                  <span
                    style={{
                      color: 'var(--accent)',
                      fontSize: 16,
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    &#8599;
                  </span>
                </a>

                <a
                  href="https://www.nichepursuits.com/forrest-webber/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                      Niche Pursuits
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      Featured interview on scaling content operations
                    </div>
                  </div>
                  <span
                    style={{
                      color: 'var(--accent)',
                      fontSize: 16,
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    &#8599;
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Modal */}
      {emailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 24,
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={() => setEmailModal(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 22,
              padding: '44px 36px 36px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(124,109,255,0.08)',
              animation: 'fadeUp 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Enter your email
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              We&apos;ll use this to create your account and send your receipt via Stripe.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '13px 18px',
                fontSize: 15,
                color: 'var(--text)',
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={handleEmailSubmit}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--accent), #9b8aff)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px 24px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(124,109,255,0.25)',
                letterSpacing: '0.02em',
                transition: 'opacity 0.2s',
              }}
            >
              Continue to Checkout
            </button>
            <button
              onClick={() => setEmailModal(null)}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-dim)',
                border: 'none',
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Responsive Overrides */}
      <style>{`
        @media (max-width: 720px) {
          main > section > div > div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
            max-width: 420px !important;
            margin: 0 auto !important;
          }
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
