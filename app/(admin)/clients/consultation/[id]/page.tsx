import { Suspense } from "react";
import { FicheClient } from "./FicheClient";

export default async function FicheClientPage(props: PageProps<"/clients/consultation/[id]">) {
  const { id } = await props.params;

  return (
    <Suspense fallback={<p className="text-sm text-brand-muted">Chargement…</p>}>
      <FicheClient id={id} />
    </Suspense>
  );
}
