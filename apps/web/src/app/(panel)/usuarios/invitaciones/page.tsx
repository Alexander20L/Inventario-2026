import { privateApi, requireAdmin } from "@/lib/session";
import type { Invitation } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { TeamTabs } from "@/components/team-tabs";
import { InviteForm } from "@/components/team-controls";
import { InvitationsTable } from "@/components/team-tables";

export const metadata = { title: "Invitaciones" };

export default async function InvitationsPage() {
  const user = await requireAdmin();
  const invitations = await privateApi<Invitation[]>("/invitations");
  return (
    <>
      <PageHeader
        title="Invitaciones"
        description={`Un lugar para cada persona en ${user.empresa.nombre}.`}
      />
      <TeamTabs invitations />
      <div className="invitation-layout">
        <section className="card">
          <InviteForm />
        </section>
        <InvitationsTable initial={invitations} />
      </div>
    </>
  );
}
