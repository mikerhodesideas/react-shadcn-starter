interface ChartThumbnailProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export function ChartThumbnail({ title, isActive, onClick, children }: ChartThumbnailProps) {
    return (
        <div 
            className={`cursor-pointer p-2 border rounded-lg transition-all ${
                isActive ? 'border-primary' : 'border-border hover:border-primary/50'
            }`}
            onClick={onClick}
        >
            <div className="h-24">
                {children}
            </div>
            <p className="text-xs text-center mt-1">{title}</p>
        </div>
    );
} 