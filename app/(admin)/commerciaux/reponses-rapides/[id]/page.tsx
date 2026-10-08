import { EditionReponseRapide } from "./EditionReponseRapide";

export default async function EditionReponseRapidePage(props: PageProps<"/commerciaux/reponses-rapides/[id]">) {
  const { id } = await props.params;

  return <EditionReponseRapide id={id} />;
}
