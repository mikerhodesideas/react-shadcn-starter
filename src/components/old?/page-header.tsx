import Balance from "react-wrap-balancer"

import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function PageHeader({ children, className, ...props }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-6" {...props}>
      {children}
    </div>
  )
}

export function PageHeaderHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
}

function PageHeaderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Balance
      className={cn(
        "max-w-[750px] text-lg text-muted-foreground sm:text-xl",
        className
      )}
      {...props}
    />
  )
}

export { PageHeaderDescription }