import { EditionProduit } from "./EditionProduit";

export default async function EditionProduitPage(props: PageProps<"/operations/produits/[id]">) {
  const { id } = await props.params;

  return <EditionProduit id={id} />;
}
