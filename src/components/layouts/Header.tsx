import { Link } from "react-router-dom";
import { Logo } from "@/components/logo";
import { mainNav } from "@/config/menu";
import { ModeToggle } from "@/components/mode-toggle";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="mr-4 hidden md:flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <Logo />
                        <span className="hidden font-bold sm:inline-block">
                            Profit Calculator
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {mainNav.map((item) => (
                            <Link
                                key={item.title}
                                to={item.href}
                                className="transition-colors hover:text-foreground/80 text-foreground/60"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </div>
                <ModeToggle />
            </div>
        </header>
    );
}