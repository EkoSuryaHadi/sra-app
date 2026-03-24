import React from 'react'
import Icon from './Icon'

export default function LockedSection({ title, description, icon = 'play' }) {
  return (
    <div className="locked-panel fade-in-up">
      <div className="locked-icon-wrap">
        <Icon name={icon} size={48} className="locked-icon" />
      </div>
      <h3 className="locked-title">{title}</h3>
      <p className="locked-copy">{description}</p>
    </div>
  )
}
