import { RendezVousDetail } from "./RendezVousDetail";

export default async function RendezVousPage(props: PageProps<"/clients/maintenance/[id]">) {
  const { id } = await props.params;

  return <RendezVousDetail id={id} />;
}
