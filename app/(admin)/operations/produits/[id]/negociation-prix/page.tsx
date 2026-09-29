import { EcranNegociationPrix } from "./EcranNegociationPrix";

export default async function NegociationPrixPage(props: PageProps<"/operations/produits/[id]/negociation-prix">) {
  const { id } = await props.params;

  return <EcranNegociationPrix produitId={Number(id)} />;
}
