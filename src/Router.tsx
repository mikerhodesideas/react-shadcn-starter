import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import NoMatch from "@/pages/NoMatch";
import DailyTrends from "@/pages/DailyTrends";
import CampaignAnalysis from "@/pages/Profit";
import ProfitCurve from "@/pages/ProfitAnalysis";
import Settings from "@/pages/Settings";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <CampaignAnalysis />,
            },
            {
                path: "/daily",
                element: <DailyTrends />,
            },
            {
                path: "/curve",
                element: <ProfitCurve />,
            },
            {
                path: "/settings",
                element: <Settings />,
            },
            {
                path: "*",
                element: <NoMatch />,
            },
        ],
    },
]);
