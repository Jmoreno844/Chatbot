"use client";
import React from "react";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

/**
 * LayoutContent component renders the main layout including sidebar and main content area.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The layout content.
 */
const LayoutContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isExpanded } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </aside>
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isExpanded ? "ml-[200px] lg:ml-[224px]" : "ml-0"
        }`}
      >
        <Navbar />
        {/* Added extra top padding to offset the floating navbar */}
        <main className="flex-1 flex flex-col pt-16 h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * Layout component for the app section
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
