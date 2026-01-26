import React from 'react'

export default function MeritaiButton({ variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary: 'meritai-btn-primary',
    accent: 'meritai-btn-accent'
  }

  const variantClass = variants[variant] || variants.primary
  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
