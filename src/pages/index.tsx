// src/pages/index.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Campaign Analytics</CardTitle>
          <CardDescription>
            Optimize your Google Ads performance with data-driven insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Get started by setting up your Google Sheets integration. Once configured, 
            your campaign data will automatically sync and be ready for analysis.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate('/setup')}
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/analysis')}
            >
              Go to Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}