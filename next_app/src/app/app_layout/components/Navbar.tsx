"use client";
import React from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu } from "lucide-react";

const Navbar = () => {
  const { isExpanded, setIsExpanded } = useSidebar();

  return (
    <nav
      className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 px-4 py-2.5 flex justify-between items-center z-30 transition-all duration-300"
      style={{
        left: isExpanded ? "200px" : "0",
      }}
    >
      <div className="flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 mr-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <span className="text-xl font-semibold">AI Hub</span>
      </div>
    </nav>
  );
};

export default Navbar;
