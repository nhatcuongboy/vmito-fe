'use client';
import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
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
    <ProtectedRouteGuard>
      <PageLayout>
        <Box maxW="800px" mx="auto">
          <Text fontSize="2xl" fontWeight="bold" mb="6">
            Tạo lớp học
          </Text>
          <ClassForm onSubmit={submit} submitting={submitting} />
        </Box>
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
