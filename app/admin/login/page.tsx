import { AdminLoginForm } from "@/components/admin-login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <p className="eyebrow">Protected admin</p>
        <h1>Admin sign in</h1>
        <p className="admin-login-copy">
          Use your configured admin username and password to access the Busha
          phishing test dashboard.
        </p>

        <AdminLoginForm />
      </section>
    </main>
  );
}
