type PlaceholderPageProps = {
  title: string;
  briefSection: string;
  description: string;
};

export function PlaceholderPage({
  title,
  briefSection,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-3 px-6 py-16">
      <span className="text-sm font-medium text-violet-600">
        {briefSection}
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-neutral-600">{description}</p>
      <p className="mt-4 rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">
        TODO — bu ekran henüz kurulmadı.
      </p>
    </main>
  );
}
