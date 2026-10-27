import { notFound } from "next/navigation";
import GlampingEditor from "@/components/admin/GlampingEditor";
import { getGlampingDetails } from "@/lib/data/glampings";

export const dynamic = "force-dynamic";

export default async function EditGlampingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const glamping = await getGlampingDetails(id);
  if (!glamping) notFound();

  return (
    <GlampingEditor
      glamping={glamping}
      images={glamping.images ?? []}
      rates={glamping.rates ?? []}
      blocks={glamping.blocks ?? []}
    />
  );
}
