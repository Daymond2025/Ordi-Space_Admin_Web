import { DeclarationDetail } from "./DeclarationDetail";

export default async function DeclarationPannePage(props: PageProps<"/clients/declarations-panne/[id]">) {
  const { id } = await props.params;

  return <DeclarationDetail id={id} />;
}
