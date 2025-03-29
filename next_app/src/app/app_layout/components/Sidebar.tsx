"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { MessageSquare, Home, FileText, Image } from "lucide-react";

// Navigation items
const navItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/docs", label: "Documentos", icon: FileText },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/image-generation", label: "Genera Imagenes", icon: Image },
];

const Sidebar = () => {
  const { isExpanded } = useSidebar();
  const pathname = usePathname();

  if (!isExpanded) return null;

  return (
    <div className="h-full bg-gray-900 text-white w-[200px] lg:w-[224px] transition-all duration-300 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Main Navigation */}
          <nav className="mb-6">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-gray-800 text-blue-400"
                          : "hover:bg-gray-800"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <IconComponent size={16} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
