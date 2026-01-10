import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { SidebarProvider } from './components/SidebarContext';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const userRole = (await cookieStore).get('user_role')?.value;
  
  return (<>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar userRole={userRole} />
          <div className="flex flex-1 flex-col h-full overflow-hidden relative">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  )
}