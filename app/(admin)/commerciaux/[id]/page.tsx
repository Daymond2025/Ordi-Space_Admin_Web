import { FicheCommercial } from "./FicheCommercial";

export default async function CommercialPage(props: PageProps<"/commerciaux/[id]">) {
  const { id } = await props.params;

  return <FicheCommercial commercialId={Number(id)} />;
}
