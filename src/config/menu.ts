import { Icons } from "@/components/icons"

interface NavItem {
    title: string
    to?: string
    href?: string
    disabled?: boolean
    external?: boolean
    icon?: keyof typeof Icons
    label?: string
}

interface NavItemWithChildren extends NavItem {
    items?: NavItemWithChildren[]
}

export const mainNav = [
    {
        title: "Campaign Analysis",
        href: "/",
    },
    {
        title: "Daily Trends",
        href: "/daily",
    },
    {
        title: "Profit Curve",
        href: "/curve",
    },
    {
        title: "Settings",
        href: "/settings",
    },
    {
        title: "Debug",
        href: "/debug",
        hidden: process.env.NODE_ENV === "production"
    }
];

export const sideMenu: NavItemWithChildren[] = []
