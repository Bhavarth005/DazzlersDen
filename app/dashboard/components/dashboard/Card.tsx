import { LucideIcon } from "lucide-react";

type DashboardCardProps = {
    title: string;
    mainText: string;
    cardIcon: LucideIcon;
    subtextIcon?: LucideIcon | null;
    subtext?: string | null;
    accentColor?: "red" | "green" | "blue";
}

const accentColorMapping = {
    "blue": "bg-blue-50 text-primary",
    "green": "bg-green-50 text-green-700",
    "red": "bg-red-50 text-red-600"
}

export default function DashboardCard({ title, mainText, cardIcon: CardIcon, subtextIcon: SubtextIcon, subtext, accentColor = "blue" } : DashboardCardProps) {
    return <div
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-34 relative overflow-hidden group">

        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{mainText}</h3>
            </div>
            <div className={`
                ${accentColorMapping[accentColor]}
                dark:bg-blue-900/20 
                p-2 rounded-lg`}>
                <CardIcon />
            </div>
        </div>
            
        {SubtextIcon &&
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 my-2 z-10">
                <SubtextIcon className="text-sm" />
                <span>{subtext}</span>
            </div>
        }

        <div
            className="absolute -right-6 -bottom-6 text-slate-50 dark:text-slate-700/50 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <CardIcon />
        </div>
    </div>
}