
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // The root /admin page redirects to the admin dashboard.
  redirect('/admin/dashboard');
}
