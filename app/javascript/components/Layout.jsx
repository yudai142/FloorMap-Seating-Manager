import React from 'react'
import SessionTimeoutWarning from './ui/SessionTimeoutWarning'

export default function Layout({ children }) {
  return (
    <>
      <SessionTimeoutWarning />
      {children}
    </>
  )
}
