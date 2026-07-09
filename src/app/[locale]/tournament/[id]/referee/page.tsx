import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ id, locale }, rawSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (key === 'view' || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
    } else {
      nextParams.set(key, value);
    }
  }

  nextParams.set('referee', '1');

  const query = nextParams.toString();
  redirect(`/${locale}/tournament/${id}/schedule${query ? `?${query}` : ''}`);
}
