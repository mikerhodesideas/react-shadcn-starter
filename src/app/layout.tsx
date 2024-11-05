import { CampaignDataProvider } from "@/contexts/campaign-data"
import { MainNav } from "@/components/nav"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CampaignDataProvider>
          <div className="border-b">
            <div className="flex h-16 items-center">
              <MainNav />
            </div>
          </div>
          <main className="container mx-auto py-6">
            {children}
          </main>
        </CampaignDataProvider>
      </body>
    </html>
  )
} 