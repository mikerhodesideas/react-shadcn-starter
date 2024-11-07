// src/config/menu.ts
import { Icons } from "@/components/icons"

interface NavItem {
    title: string
    to?: string
    href?: string
    disabled?: boolean
    external?: boolean
    icon?: keyof typeof Icons
    label?: string
    hidden?: boolean
}

interface NavItemWithChildren extends NavItem {
    items?: NavItemWithChildren[]
}

export const mainNav: NavItem[] = [
    {
        title: "Home",
        href: "/",
    },
    {
        title: "Setup",
        href: "/setup",
    },
    {
        title: "Settings",
        href: "/settings",
    },
    {
        title: "Analysis",
        href: "/analysis",
    },
    {
        title: "Daily Trends",
        href: "/trends",
    },
    {
        title: "Profit Curve",
        href: "/curve",
    },
    {
        title: "Debug",
        href: "/debug",
        hidden: process.env.NODE_ENV === "production"
    }
];

export const sideMenu: NavItemWithChildren[] = []