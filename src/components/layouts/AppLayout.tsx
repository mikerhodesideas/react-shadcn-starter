import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import Footer from "./Footer";

export default function AppLayout() {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container py-6">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
