import { PlaceholderPage } from "@/components/placeholder-page";

export default async function BolumSayfasiPage({
  params,
}: {
  params: Promise<{ schoolId: string; departmentId: string }>;
}) {
  const { schoolId, departmentId } = await params;
  return (
    <PlaceholderPage
      title={`Bölüm — ${schoolId} / ${departmentId}`}
      briefSection="Bölüm 5 · MVP"
      description="Sınıf/yıl filtresi, bölümdeki kullanıcılar, dersler, skill'ler, rehberler ve 'bölüm hakkında bilgi al' akışı."
    />
  );
}
