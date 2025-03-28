"use client";
import React from "react";
import { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BaseLayoutProps {
  children: React.ReactNode;
  metadata?: Metadata;
}

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
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};

/**
 * BaseLayout component wraps the application with necessary providers and applies global metadata.
 *
 * @param {BaseLayoutProps} props - The component props.
 * @returns {JSX.Element} The base layout wrapping component.
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({ children, metadata }) => {
  if (metadata) {
    // Attach metadata to the global object for potential dynamic usage
    // @ts-expect-error
    globalThis.metadata = metadata;
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default BaseLayout;
