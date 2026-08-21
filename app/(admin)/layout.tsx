import { AdminShell } from "@/components/AdminShell";
import { RouteGuard } from "@/components/RouteGuard";

export default function AdminGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <RouteGuard>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
