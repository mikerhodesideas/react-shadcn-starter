import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import { useTheme } from "@/components/theme-provider";

export default function AppLayout() {
    const { theme } = useTheme();
    
    return (
        <div className={`relative flex min-h-screen flex-col ${theme}`}>
            <Header />
            <main className="flex-1 container py-6">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
