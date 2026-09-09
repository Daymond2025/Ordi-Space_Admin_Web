import { FicheFournisseur } from "./FicheFournisseur";

export default async function FournisseurPage(props: PageProps<"/fournisseurs/[id]">) {
  const { id } = await props.params;

  return <FicheFournisseur fournisseurId={Number(id)} />;
}
