import React from "react";
import { Outlet } from "react-router-dom";
import { Header, Sidebar } from "../AppLayout";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-[#070B13] overflow-x-hidden">
      <div className="min-h-screen bg-gradient-to-br from-yellow-900/40 via-transparent to-yellow-900/20">
        <div className="flex overflow-x-hidden min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/30 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}