import { useState } from 'react'
import { Icon } from '@iconify/react'

interface SpinnerProps {
  size?: number
  color?: string
}

const bars = [
  { animationDelay: '-1.2s', transform: 'rotate(.0001deg) translate(146%)' },
  { animationDelay: '-1.1s', transform: 'rotate(30deg) translate(146%)' },
  { animationDelay: '-1.0s', transform: 'rotate(60deg) translate(146%)' },
  { animationDelay: '-0.9s', transform: 'rotate(90deg) translate(146%)' },
  { animationDelay: '-0.8s', transform: 'rotate(120deg) translate(146%)' },
  { animationDelay: '-0.7s', transform: 'rotate(150deg) translate(146%)' },
  { animationDelay: '-0.6s', transform: 'rotate(180deg) translate(146%)' },
  { animationDelay: '-0.5s', transform: 'rotate(210deg) translate(146%)' },
  { animationDelay: '-0.4s', transform: 'rotate(240deg) translate(146%)' },
  { animationDelay: '-0.3s', transform: 'rotate(270deg) translate(146%)' },
  { animationDelay: '-0.2s', transform: 'rotate(300deg) translate(146%)' },
  { animationDelay: '-0.1s', transform: 'rotate(330deg) translate(146%)' }
]

const Spinner = ({ size = 20, color = '#fcf9f6' }: SpinnerProps) => {
  return (
    <div style={{ width: size, height: size }}>
      <style>
        {`
          @keyframes spin {
              0% { opacity: 0.15; }
              100% { opacity: 1; }
          }
        `}
      </style>
      <div className="relative top-1/2 left-1/2" style={{ width: size, height: size }}>
        {bars.map((item) => (
          <div
            key={item.transform}
            className="absolute h-[8%] w-[24%] -left-[10%] -top-[3.9%]"
            style={{ backgroundColor: color, animation: 'spin 1.2s linear infinite', ...item }}
          />
        ))}
      </div>
    </div>
  )
}

interface RegisterSectionProps {
  onSubmit?: (data: { email: string; message: string }) => void
}

export function RegisterSection({ onSubmit }: RegisterSectionProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      if (onSubmit) {
        onSubmit({ email, message })
      }

      setTimeout(() => {
        setEmail('')
        setMessage('')
        setSuccess(false)
      }, 3000)
    }, 1500)
  }

  return (
    <section id="waitlist" className="py-16 md:py-24 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto px-6 md:px-8 w-full">
        {/* Section Header */}
        <div className="mb-10 md:mb-12 text-center">
          <span className="typography-technical-label text-grid">JOIN THE WAITLIST</span>
          <h2 className="typography-display-lg text-forest mt-2 text-4xl md:text-[64px]">Secure Early Access</h2>
        </div>

        <div className="relative bg-paper border border-grid/20 p-6 md:p-12">
          {/* Corner Markers */}
          <div className="corner-marker corner-tl" />
          <div className="corner-marker corner-tr" />
          <div className="corner-marker corner-bl" />
          <div className="corner-marker corner-br" />

          {/* Description */}
          <p className="typography-body-lg text-grid text-center leading-relaxed max-w-xl mx-auto mb-8 text-base md:text-lg">
            Be among the first to experience autonomous hackathon intelligence. Register your interest and help shape the future by suggesting features you'd like to see.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="typography-technical-sm text-forest mb-2 block">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-transparent border-b border-grid/20 px-0 py-3 jetbrains text-sm focus:outline-none focus:border-forest transition-colors disabled:bg-transparent disabled:cursor-not-allowed"
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="message" className="typography-technical-sm text-forest mb-2 block">
                Feature Suggestions (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what features you'd like to see implemented..."
                rows={4}
                className="w-full bg-transparent border border-grid/20 px-3 py-3 jetbrains text-sm focus:outline-none focus:border-forest transition-colors resize-none disabled:bg-transparent disabled:cursor-not-allowed"
                disabled={loading || success}
              />
              <p className="mt-2 typography-technical-sm text-grid/60">
                Share your ideas and help us build something amazing together
              </p>
            </div>

            {error && (
              <div className="p-4 bg-forest text-white jetbrains text-sm border border-forest">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-mint text-white jetbrains text-sm border border-mint">
                ✓ Successfully registered! We'll be in touch soon.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full cursor-pointer jetbrains text-[10px] uppercase px-6 py-4 border border-forest text-forest bg-transparent hover:bg-forest hover:text-white transition-colors disabled:bg-grid disabled:border-grid disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Spinner size={20} color="#022617" />
                  <span>Processing...</span>
                </>
              ) : success ? (
                <span>Registered ✓</span>
              ) : (
                <>
                  <span>Register Interest</span>
                  <Icon icon="lucide:send" width={20} />
                </>
              )}
            </button>
          </form>

          {/* Stats */}
          <div className="mt-8 pt-6 border-t border-grid/20">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold space-grotesk mb-1 text-forest">147</div>
                <div className="typography-technical-sm text-grid/60 uppercase">Registered</div>
              </div>
              <div>
                <div className="text-3xl font-bold space-grotesk mb-1 text-forest">89</div>
                <div className="typography-technical-sm text-grid/60 uppercase">Suggestions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}