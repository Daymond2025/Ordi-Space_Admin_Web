import { ListeNotifications } from "@/components/notifications/Notifications";

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-brand-ink">Notifications</h1>
      <ListeNotifications />
    </div>
  );
}
