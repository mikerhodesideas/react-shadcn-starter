import React from 'react';

const navItems = [
  // ... existing nav items
  {
    title: "Debug",
    href: "/debug",
    // Optionally hide in production
    hidden: process.env.NODE_ENV === "production"
  }
]

// ... rest of the component 