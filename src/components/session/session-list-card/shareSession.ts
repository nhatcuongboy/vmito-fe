import { ISession } from '@/lib/api/types';

export const shareSession = async (
  session: ISession,
  text: string,
  onLinkCopied: () => void
) => {
  const url = `${window.location.origin}/sessions/${session.slug || session.id}`;

  try {
    if (navigator.share) {
      await navigator.share({ title: session.name, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    onLinkCopied();
  } catch (error) {
    console.error('Error sharing session:', error);
  }
};
