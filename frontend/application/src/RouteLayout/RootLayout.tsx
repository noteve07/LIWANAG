import { Outlet, useLocation } from "react-router-dom";
import { Header, Sidebar } from "../AppLayout";
import PageTransition from "../components/ui/PageTransition";

export default function RootLayout() {
  const location = useLocation();
  
  return (
    <div className="flex bg-[#070B13] overflow-hidden">
      <div className="fixed w-screen">
        <Header />
      </div>
      
      <div className="flex flex-1 h-screen pt-17">
        <Sidebar />
        <main className="flex-1 bg-gradient-to-br from-yellow-900/30 via-transparent to-yellow-900/30 overflow-y-auto">
          <div className="h-full">
            <PageTransition key={location.pathname.split('/')[1]}>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}