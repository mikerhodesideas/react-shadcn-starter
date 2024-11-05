import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "@/components/layouts/app-layout";
import Analysis from "@/pages/analysis";
import Trends from "@/pages/trends";
import Curve from "@/pages/curve";
import Settings from "@/pages/index";
import ErrorBoundary from "./ErrorBoundart";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
        children: [
            {
                index: true,
                element: <Settings />,
                errorElement: <ErrorBoundary />,
            },
            {
                path: "analysis",
                element: <Analysis />,
                errorElement: <ErrorBoundary />,
            },
            {
                path: "trends",
                element: <Trends />,
                errorElement: <ErrorBoundary />,
            },
            {
                path: "curve",
                element: <Curve />,
                errorElement: <ErrorBoundary />,
            }
        ],
    },
]);

export default function Router() {
    return <RouterProvider router={router} />
}
