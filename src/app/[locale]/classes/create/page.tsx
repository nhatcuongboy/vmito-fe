'use client';
import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { ClassForm } from '@/components/classes/ClassForm';
import { ClassesService } from '@/lib/api/classes.service';
import { IClassInput } from '@/types/class';
import { useRouter } from '@/i18n/config';

export default function CreateClassPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const submit = async (input: IClassInput) => {
    setSubmitting(true);
    try {
      const item = await ClassesService.create(input);
      router.push(`/my-classes/${item.id}/edit`);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ProtectedRouteGuard featureFlag="CLASSES_FEATURE_ENABLED">
      <PageLayout title="Tạo lớp học" showBackButton backHref="/classes">
        <ClassForm
          onSubmit={submit}
          submitting={submitting}
          backHref="/classes"
        />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
