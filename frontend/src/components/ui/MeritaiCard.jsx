import React from 'react'

export default function MeritaiCard({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`meritai-card ${className}`} {...props}>
      {children}
    </Component>
  )
}
