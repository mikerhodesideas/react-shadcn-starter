import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import NoMatch from "@/pages/NoMatch";
import Sample from "@/pages/Sample";
import Profit from "@/pages/Profit";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Profit />,
            },
            {
                path: "/sample",
                element: <Sample />,
            },
            {
                path: "*",
                element: <NoMatch />,
            },
        ],
    },
]);
