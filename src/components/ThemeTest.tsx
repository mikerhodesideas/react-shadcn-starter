// src/components/ThemeTest.tsx
import React from 'react';
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeTest() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="p-4 space-y-4 border rounded">
      <p>Current theme: {theme}</p>
      <div className="space-x-2">
        <Button onClick={() => setTheme("light")}>Light</Button>
        <Button onClick={() => setTheme("dark")}>Dark</Button>
        <Button onClick={() => setTheme("system")}>System</Button>
      </div>
      <div className="space-y-2">
        <div className="p-4 bg-background text-foreground border">Background</div>
        <div className="p-4 bg-primary text-primary-foreground border">Primary</div>
        <div className="p-4 bg-secondary text-secondary-foreground border">Secondary</div>
        <div className="p-4 bg-muted text-muted-foreground border">Muted</div>
      </div>
    </div>
  )
}