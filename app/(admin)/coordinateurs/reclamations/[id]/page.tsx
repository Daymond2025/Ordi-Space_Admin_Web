import { FicheReclamation } from "./FicheReclamation";

export default async function ReclamationPage(props: PageProps<"/coordinateurs/reclamations/[id]">) {
  const { id } = await props.params;

  return <FicheReclamation reclamationId={Number(id)} />;
}
