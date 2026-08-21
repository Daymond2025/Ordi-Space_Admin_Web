import { EditionContenu } from "./EditionContenu";

export default async function EditionContenuPage(props: PageProps<"/clients/contenu/[id]">) {
  const { id } = await props.params;

  return <EditionContenu id={id} />;
}
