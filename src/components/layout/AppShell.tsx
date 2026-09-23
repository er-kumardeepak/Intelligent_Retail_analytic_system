import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppShell() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] px-3 py-5 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
