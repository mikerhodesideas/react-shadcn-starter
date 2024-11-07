import { ThemeProvider } from "@/components/theme-provider"
import { ThemeSwitcher } from "@/components/theme-toggle"
import { CampaignDataProvider } from '@/contexts/campaign-data'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CampaignDataProvider>
            <div className="min-h-screen">
              {/* Header */}
              <header className="border-b">
                <div className="container flex h-16 items-center justify-between">
                  <nav>
                    {/* Your existing navigation */}
                  </nav>
                  <ThemeSwitcher />
                </div>
              </header>
              
              {/* Main content */}
              <main className="container py-6">
                {children}
              </main>
            </div>
          </CampaignDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}