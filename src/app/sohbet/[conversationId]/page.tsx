import { PlaceholderPage } from "@/components/placeholder-page";

export default async function SohbetPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <PlaceholderPage
      title={`Sohbet — ${conversationId}`}
      briefSection="Bölüm 8, 9 · MVP/V2"
      description="Metin mesajlaşma, AI conversation starter, Spin the Question, Conversation Rescue SOS, session/meetup planlama, block/report."
    />
  );
}
