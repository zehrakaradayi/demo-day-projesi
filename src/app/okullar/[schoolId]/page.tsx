import { PlaceholderPage } from "@/components/placeholder-page";

export default async function OkulProfiliPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return (
    <PlaceholderPage
      title={`Okul Profili — ${schoolId}`}
      briefSection="Bölüm 5 · MVP"
      description="Öğrenci sayısı, popüler skills, community'ler, etkinlikler, bölüm listesi."
    />
  );
}
