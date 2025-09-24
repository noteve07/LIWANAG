import { Outlet, useLocation } from "react-router-dom";
import { Header, Sidebar } from "../AppLayout";
import PageTransition from "../components/ui/PageTransition";


export default function RootLayout() {
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-[#070B13] overflow-hidden">
      {/* Sidebar - Full Height */}
      <Sidebar />
      
      {/* Right Side - Header + Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
          <main className="flex-1 bg-[#0D1117] overflow-y-auto scrollbar">
            <div className="h-full w-full px-4 py-4">
              <PageTransition key={location.pathname.split('/')[1]}>
                <Outlet />
              </PageTransition>
            </div>
          </main>

      </div>
    </div>
  );
}