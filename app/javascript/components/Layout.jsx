import React from 'react'
import SessionTimeoutWarning from './ui/SessionTimeoutWarning'
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <>
      <SessionTimeoutWarning />
      <Navbar />
      {children}
    </>
  )
}
