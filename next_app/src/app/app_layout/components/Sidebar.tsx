"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  MessageSquare,
  Plus,
  Home,
  FileText,
  Image,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Mock chat data - replace with real data in your application
const mockChats = [
  { id: 1, title: "Project discussion", date: "2 hours ago" },
  { id: 2, title: "Weekly planning", date: "Yesterday" },
  { id: 3, title: "Customer requirements", date: "3 days ago" },
  { id: 4, title: "Technical issues", date: "Last week" },
];

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
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);

  const handleToggleChats = () => {
    setIsChatsExpanded((prev) => !prev);
  };

  const handleKeyToggleChats = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleChats();
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="h-full bg-gray-900 text-white w-[200px] lg:w-[224px] transition-all duration-300 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md p-2 mb-4 transition-colors">
            <Plus size={16} />
            <span>New Chat</span>
          </button>

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

          {/* Collapsible Recent Chats Section */}
          <div className="mb-2">
            <div
              className="flex items-center justify-between text-sm font-semibold text-gray-400 p-1 cursor-pointer hover:bg-gray-800 rounded-md transition-colors"
              onClick={handleToggleChats}
              onKeyDown={handleKeyToggleChats}
              tabIndex={0}
              role="button"
              aria-expanded={isChatsExpanded}
              aria-controls="recent-chats-list"
            >
              <h2>Recent Chats</h2>
              {isChatsExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isChatsExpanded ? "max-h-96" : "max-h-0"
              }`}
            >
              <ul id="recent-chats-list" className="space-y-1 mt-2">
                {mockChats.map((chat) => (
                  <li key={chat.id}>
                    <a
                      href="#"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800 transition-colors"
                      tabIndex={isChatsExpanded ? 0 : -1}
                      aria-label={`Chat: ${chat.title}`}
                    >
                      <MessageSquare size={16} />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm truncate">{chat.title}</p>
                        <p className="text-xs text-gray-400">{chat.date}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
