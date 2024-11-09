// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";
import { CampaignDataProvider } from "@/contexts/campaign-data";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="app-theme">
          <CampaignDataProvider>
            <div className="min-h-screen bg-background text-foreground">
              {/* Header */}
              <header className="border-b">
                <div className="container flex h-16 items-center justify-between">
                  <nav>
                    {/* Navigation here */}
                  </nav>
                  <ThemeToggle />
                </div>
              </header>

              {/* Main Content */}
              <main className="container py-6">{children}</main>
            </div>
          </CampaignDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}