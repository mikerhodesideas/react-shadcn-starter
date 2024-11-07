// src/Router.tsx

import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/components/layouts/root-layout";
import Index from "@/pages/index";
import Analysis from "@/pages/analysis";
import Trends from "@/pages/trends";
import Curve from "@/pages/curve";
import Settings from "@/pages/settings";
import Setup from "@/pages/setup";
import Debug from "@/pages/debug";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
       
        children: [
            {
                index: true,
                element: <Index />,
            },
            {
                path: "setup",
                element: <Setup />,
            },
            {
                path: "settings",
                element: <Settings />,
            },
            {
                path: "analysis",
                element: <Analysis />,
            },
            {
                path: "trends",
                element: <Trends />,
            },
            {
                path: "curve",
                element: <Curve />,
            },
            {
                path: "debug",
                element: <Debug />,
            }
        ],
    },
]);
