import { FicheLivreur } from "./FicheLivreur";

export default async function LivreurPage(props: PageProps<"/livreurs/[id]">) {
  const { id } = await props.params;

  return <FicheLivreur livreurId={Number(id)} />;
}
