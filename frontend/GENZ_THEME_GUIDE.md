# Gen-Z Theme Usage Guide

## 🎨 Overview
This guide shows you how to use the Gen-Z themed styles to make the student interface fun, engaging, and modern!

## 🚀 Quick Start

### Import the Theme
The theme is automatically imported in `main.jsx`. No additional imports needed!

### Using Gen-Z Classes

#### Cards
```jsx
// Basic modern card with hover effect
<div className="genz-card">
  Content here
</div>

// Gradient card
<div className="genz-card-gradient">
  Content in purple-pink gradient
</div>

// Glass effect card
<div className="genz-card-glass">
  Frosted glass effect
</div>
```

#### Buttons
```jsx
// Primary button (purple-pink gradient)
<button className="genz-btn-primary">Click me! 🚀</button>

// Secondary button (blue-cyan gradient)
<button className="genz-btn-secondary">Learn More</button>

// Success button (green-teal gradient)
<button className="genz-btn-success">Start Quiz ✨</button>

// Warning button (yellow-orange gradient)
<button className="genz-btn-warning">Be Careful!</button>

// Outline button
<button className="genz-btn-outline">Secondary Action</button>
```

#### Badges
```jsx
// Color badges
<span className="genz-badge genz-badge-purple">New!</span>
<span className="genz-badge genz-badge-pink">Hot! 🔥</span>
<span className="genz-badge genz-badge-blue">Cool</span>
<span className="genz-badge genz-badge-green">Active</span>

// Gradient badge
<span className="genz-badge genz-badge-gradient">Premium ⭐</span>
```

#### Gradient Text
```jsx
// Purple-pink gradient text
<h1 className="genz-gradient-text">Amazing Title!</h1>

// Rainbow gradient text
<h1 className="genz-gradient-text-rainbow">Super Cool! 🌈</h1>
```

#### Progress Bars
```jsx
// Standard progress bar
<div className="genz-progress-bar">
  <div className="genz-progress-fill" style={{ width: '75%' }}></div>
</div>

// Rainbow progress bar
<div className="genz-progress-bar">
  <div className="genz-progress-rainbow" style={{ width: '75%' }}></div>
</div>
```

#### Input Fields
```jsx
// Modern input with purple focus
<input className="genz-input" placeholder="Type something..." />

// Textarea
<textarea className="genz-textarea" placeholder="Your thoughts..."></textarea>

// Select dropdown
<select className="genz-select">
  <option>Option 1</option>
</select>
```

## 🎭 Animations

### Bounce Animation
```jsx
<div className="genz-bounce">
  I'm bouncing! 🎾
</div>
```

### Pulse Animation
```jsx
<div className="genz-pulse">
  Pulsing effect
</div>
```

### Float Animation
```jsx
<div className="genz-float">
  Floating smoothly ☁️
</div>
```

### Wiggle Animation
```jsx
<div className="genz-wiggle">
  Quick wiggle!
</div>
```

### Shimmer Effect
```jsx
<div className="genz-shimmer">
  Shimmering...
</div>
```

## 🎯 Quiz-Specific Styles

### Quiz Cards
```jsx
<div className="genz-quiz-card">
  Quiz content here
</div>
```

### Quiz Options
```jsx
// Normal option
<div className="genz-quiz-option">
  Option A
</div>

// Selected option
<div className="genz-quiz-option-selected">
  Option B (Selected)
</div>

// Correct answer
<div className="genz-quiz-option-correct">
  Option C ✓
</div>

// Incorrect answer
<div className="genz-quiz-option-incorrect">
  Option D ✗
</div>
```

### Score Display
```jsx
<div className="genz-score-display">
  <div className="genz-score-number">95</div>
  <p>Awesome Score! 🎉</p>
</div>
```

## 🏆 Achievements

### Trophy
```jsx
<span className="genz-trophy">🏆</span>
```

### Achievement Badge
```jsx
<div className="genz-achievement-badge">
  <span className="text-2xl">⭐</span>
</div>
```

## ⏱️ Timers

### Normal Timer
```jsx
<div className="genz-timer">
  <Clock className="w-5 h-5 mr-2" />
  15:30
</div>
```

### Warning Timer (< 5 min)
```jsx
<div className="genz-timer-warning">
  <Clock className="w-5 h-5 mr-2" />
  04:30
</div>
```

### Danger Timer (< 1 min)
```jsx
<div className="genz-timer-danger">
  <Clock className="w-5 h-5 mr-2" />
  00:45
</div>
```

## 🔔 Notifications

```jsx
// Success notification
<div className="genz-notification-success">
  <CheckCircle className="w-5 h-5" />
  <span>Quiz completed! 🎉</span>
</div>

// Error notification
<div className="genz-notification-error">
  <XCircle className="w-5 h-5" />
  <span>Oops! Something went wrong</span>
</div>

// Info notification
<div className="genz-notification-info">
  <Info className="w-5 h-5" />
  <span>New quiz available!</span>
</div>
```

## 🎨 Color Variables

Use these CSS variables for custom styling:

```css
var(--genz-purple)    /* #8B5CF6 */
var(--genz-pink)      /* #EC4899 */
var(--genz-blue)      /* #3B82F6 */
var(--genz-cyan)      /* #06B6D4 */
var(--genz-yellow)    /* #F59E0B */
var(--genz-green)     /* #10B981 */

/* Gradients */
var(--gradient-purple-pink)
var(--gradient-blue-cyan)
var(--gradient-yellow-orange)
var(--gradient-green-teal)
var(--gradient-rainbow)
```

## 💡 Best Practices

1. **Use Emojis Liberally** 🎉
   - Add personality with relevant emojis
   - Use the `genz-emoji` class for hover effects

2. **Combine Animations**
   - Don't overdo it - 1-2 animated elements per section
   - Use subtle animations for better UX

3. **Responsive Design**
   - All Gen-Z classes are mobile-first
   - Test on different screen sizes

4. **Accessibility**
   - Maintain good contrast ratios
   - Don't rely solely on color for information

5. **Performance**
   - Animations use CSS, not JavaScript
   - Gradients are hardware-accelerated

## 📱 Mobile Optimization

All Gen-Z styles are optimized for mobile:
- Touch-friendly button sizes (min-height: 44px)
- Responsive text sizes
- Optimized animations for performance

## 🎓 Example: Complete Quiz Card

```jsx
<div className="genz-quiz-card">
  <h3 className="genz-gradient-text text-xl font-bold mb-2">
    Math Quiz 🧮
  </h3>
  <p className="text-gray-600 mb-4">
    Test your algebra skills!
  </p>
  <div className="flex items-center justify-between">
    <span className="genz-badge genz-badge-gradient">
      20 Questions
    </span>
    <button className="genz-btn-primary">
      Start Now! 🚀
    </button>
  </div>
</div>
```

## 🌟 Have Fun!

Remember: The goal is to make learning fun and engaging! Use vibrant colors, playful animations, and don't be afraid to add personality with emojis! ✨🎯🚀
