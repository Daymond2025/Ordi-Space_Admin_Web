import { FicheCoordinateur } from "./FicheCoordinateur";

export default async function CoordinateurPage(props: PageProps<"/coordinateurs/[id]">) {
  const { id } = await props.params;

  return <FicheCoordinateur coordinateurId={Number(id)} />;
}
