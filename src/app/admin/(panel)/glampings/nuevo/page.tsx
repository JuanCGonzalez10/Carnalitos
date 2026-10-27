import GlampingEditor from "@/components/admin/GlampingEditor";

export const dynamic = "force-dynamic";

export default function NewGlampingPage() {
  return <GlampingEditor glamping={null} images={[]} rates={[]} blocks={[]} />;
}
