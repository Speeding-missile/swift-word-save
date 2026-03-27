import { Folder, LayoutDashboard, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export type MobileTab = "folders" | "dashboard" | "tools";

interface BottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "folders" as MobileTab, label: "Folders", icon: Folder },
    { id: "dashboard" as MobileTab, label: "Vault", icon: LayoutDashboard },
    { id: "tools" as MobileTab, label: "Tools", icon: Wrench },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 h-auto pointer-events-none">
      <div className="mx-auto max-w-sm bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-around p-1 pointer-events-auto overflow-hidden ring-1 ring-black/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 flex-1 transition-colors duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={18} className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`} />
              <span className="relative z-10 font-mono text-[9px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
