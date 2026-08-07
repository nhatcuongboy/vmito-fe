'use client';
import { useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { ClassForm } from '@/components/classes/ClassForm';
import { ClassesService } from '@/lib/api/classes.service';
import { IClass, IClassInput } from '@/types/class';
import { useRouter } from '@/i18n/config';

export default function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [item, setItem] = useState<IClass | null>(null),
    [submitting, setSubmitting] = useState(false);
  const [id, setId] = useState('');
  const router = useRouter();
  useEffect(() => {
    void params.then(async ({ id: next }) => {
      setId(next);
      setItem(await ClassesService.get(next));
    });
  }, [params]);
  const submit = async (input: IClassInput) => {
    setSubmitting(true);
    try {
      await ClassesService.update(id, input);
      router.push('/my-classes');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ProtectedRouteGuard>
      <PageLayout
        title="Chỉnh sửa lớp học"
        showBackButton
        backHref="/my-classes"
      >
        {item ? (
          <ClassForm
            initial={item}
            onSubmit={submit}
            submitting={submitting}
            backHref="/my-classes"
          />
        ) : (
          <Text>Đang tải...</Text>
        )}
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
