import { Outlet, useLocation } from "react-router-dom";
import { Header, Sidebar } from "../AppLayout";
import PageTransition from "../components/ui/PageTransition";

export default function RootLayout() {
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-[#070B13]">
      <div className="fixed h-screen">
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 ml-60 min-h-screen">
        <Header />
        <main className="flex-1 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/30 overflow-y-auto">
          <div className="min-h-screen bg-gradient-to-br from-yellow-900/40 via-transparent to-yellow-900/20">
            <PageTransition key={location.pathname.split('/')[1]}>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}