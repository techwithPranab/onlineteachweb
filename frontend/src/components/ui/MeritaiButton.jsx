import React from 'react'

export default function MeritaiButton({ variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary: 'meritai-btn-primary',
    accent: 'meritai-btn-accent'
  }

  const variantClass = variants[variant] || variants.primary
  
  // Ensure primary variant has the correct background
  const style = variant === 'primary' ? {
    background: 'linear-gradient(90deg, #059669, #0d9488)',
    ...props.style
  } : props.style
  
  return (
    <button className={`${className} ${variantClass}`} style={style} {...props}>
      {children}
    </button>
  )
}
