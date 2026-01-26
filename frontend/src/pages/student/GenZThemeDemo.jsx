import { useState } from 'react'
import { 
  Sparkles, 
  Trophy, 
  Zap, 
  Heart, 
  Star,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import MeritaiButton from '@/components/ui/MeritaiButton'

/**
 * Gen-Z Theme Demo Page
 * 
 * Purpose: Showcase all Gen-Z themed components and styles
 * This is a reference page for developers
 */
export default function GenZThemeDemo() {
  const [progress, setProgress] = useState(75)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-black mb-4">
            <span className="meritai-title-gradient">
              Gen-Z Theme Demo ✨
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Modern, vibrant, and super engaging! 🚀
          </p>
        </div>

        {/* Cards Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            📦 Card Styles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="genz-card p-6">
              <h3 className="font-bold text-xl mb-2">Standard Card</h3>
              <p className="text-gray-600">Clean and modern with hover effect</p>
            </div>
            <div className="genz-card-gradient p-6">
              <h3 className="font-bold text-xl mb-2">Gradient Card</h3>
              <p className="text-white/90">Purple-pink gradient background</p>
            </div>
            <div className="genz-card-glass p-6">
              <h3 className="font-bold text-xl mb-2">Glass Card</h3>
              <p className="text-gray-700">Frosted glass effect</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🔘 Button Styles
          </h2>
          <div className="flex flex-wrap gap-4">
            <MeritaiButton className="">Click me! 🚀</MeritaiButton>
            <button className="genz-btn-secondary">
              Secondary Button
            </button>
            <button className="genz-btn-success">
              Success Button ✓
            </button>
            <button className="genz-btn-warning">
              Warning Button ⚠️
            </button>
            <button className="genz-btn-outline">
              Outline Button
            </button>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🏷️ Badge Styles
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="genz-badge genz-badge-purple">Purple Badge</span>
            <span className="genz-badge genz-badge-pink">Pink Badge 💖</span>
            <span className="genz-badge genz-badge-blue">Blue Badge</span>
            <span className="genz-badge genz-badge-green">Green Badge ✓</span>
            <span className="genz-badge genz-badge-gradient">Gradient Badge ⭐</span>
          </div>
        </section>

        {/* Progress Bars */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            📊 Progress Bars
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Standard Progress</label>
              <div className="genz-progress-bar">
                <div className="genz-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rainbow Progress</label>
              <div className="genz-progress-bar">
                <div className="genz-progress-rainbow" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full"
            />
          </div>
        </section>

        {/* Input Fields */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            ✏️ Input Fields
          </h2>
          <div className="space-y-4 max-w-md">
            <input 
              className="genz-input" 
              placeholder="Type something awesome..."
            />
            <textarea 
              className="genz-textarea" 
              placeholder="Your thoughts..."
              rows="4"
            ></textarea>
            <select className="genz-select">
              <option>Choose an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </section>

        {/* Animations */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🎭 Animations
          </h2>
          <div className="flex flex-wrap gap-8 items-center justify-center">
            <div className="text-center">
              <div className="genz-bounce text-4xl mb-2">🎾</div>
              <p className="text-sm">Bounce</p>
            </div>
            <div className="text-center">
              <div className="genz-pulse text-4xl mb-2">💫</div>
              <p className="text-sm">Pulse</p>
            </div>
            <div className="text-center">
              <div className="genz-float text-4xl mb-2">☁️</div>
              <p className="text-sm">Float</p>
            </div>
            <div className="text-center">
              <div className="genz-wiggle text-4xl mb-2">🎯</div>
              <p className="text-sm">Wiggle</p>
            </div>
          </div>
        </section>

        {/* Quiz Components */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🎯 Quiz Components
          </h2>
          <div className="space-y-4">
            <div className="genz-quiz-card">
              <h3 className="font-bold text-xl mb-2">Math Quiz 🧮</h3>
              <p className="text-gray-600">Test your algebra skills!</p>
            </div>
            <div className="space-y-2">
              <div className="genz-quiz-option">Option A: Normal</div>
              <div className="genz-quiz-option-selected">Option B: Selected</div>
              <div className="genz-quiz-option-correct">Option C: Correct ✓</div>
              <div className="genz-quiz-option-incorrect">Option D: Incorrect ✗</div>
            </div>
          </div>
        </section>

        {/* Score Display */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🏆 Score Display
          </h2>
          <div className="genz-score-display rounded-3xl">
            <div className="genz-score-number">95</div>
            <p className="text-2xl font-bold text-white">Awesome Score! 🎉</p>
            <p className="text-white/80 mt-2">You're crushing it!</p>
          </div>
        </section>

        {/* Timers */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            ⏱️ Timer Styles
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="genz-timer">
              <Clock className="w-5 h-5 mr-2" />
              15:30
            </div>
            <div className="genz-timer-warning">
              <Clock className="w-5 h-5 mr-2" />
              04:30
            </div>
            <div className="genz-timer-danger">
              <Clock className="w-5 h-5 mr-2" />
              00:45
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🏅 Achievements
          </h2>
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-center">
              <div className="genz-achievement-badge mb-2">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium">Champion</p>
            </div>
            <div className="text-center">
              <div className="genz-achievement-badge mb-2">
                <Star className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium">Star</p>
            </div>
            <div className="text-center">
              <div className="genz-achievement-badge mb-2">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium">Lightning</p>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            🔔 Notifications
          </h2>
          <div className="space-y-4 max-w-md">
            <div className="genz-notification-success relative">
              <CheckCircle className="w-5 h-5" />
              <span>Quiz completed successfully! 🎉</span>
            </div>
            <div className="genz-notification-error relative">
              <XCircle className="w-5 h-5" />
              <span>Oops! Something went wrong</span>
            </div>
            <div className="genz-notification-info relative">
              <Sparkles className="w-5 h-5" />
              <span>New quiz available!</span>
            </div>
          </div>
        </section>

        {/* Emoji Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6 genz-gradient-text">
            😊 Emoji Power
          </h2>
          <div className="flex flex-wrap gap-4 justify-center text-4xl">
            <span className="genz-emoji">🎯</span>
            <span className="genz-emoji">🚀</span>
            <span className="genz-emoji">✨</span>
            <span className="genz-emoji">🏆</span>
            <span className="genz-emoji">💯</span>
            <span className="genz-emoji">🔥</span>
            <span className="genz-emoji">⭐</span>
            <span className="genz-emoji">💪</span>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center genz-card-gradient p-12 rounded-3xl">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Start? 🚀
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Let's make learning awesome together!
          </p>
          <button className="genz-btn-warning text-lg px-8 py-4">
            Start Your Journey! ✨
          </button>
        </section>
      </div>
    </div>
  )
}
