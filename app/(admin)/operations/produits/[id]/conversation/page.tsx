import { EcranConversationProduit } from "./EcranConversationProduit";

export default async function ConversationProduitPage(props: PageProps<"/operations/produits/[id]/conversation">) {
  const { id } = await props.params;

  return <EcranConversationProduit produitId={Number(id)} />;
}
