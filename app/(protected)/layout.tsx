import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Nav from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full p-4">
        <Nav />
        {children}
        <Toaster />
      </main>
    </SidebarProvider>
  );
}
