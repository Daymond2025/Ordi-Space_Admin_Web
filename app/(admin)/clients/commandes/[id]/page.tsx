import { CommandeDetail } from "./CommandeDetail";

export default async function CommandeDetailPage(props: PageProps<"/clients/commandes/[id]">) {
  const { id } = await props.params;

  return <CommandeDetail id={id} />;
}
