'use client';

import SessionForm from './SessionForm';
import { ISession } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';

interface NewSessionFormProps {
  backHref: string;
  onSuccess: (session: ISession) => void;
}

export default function NewSessionForm({
  backHref,
  onSuccess,
}: NewSessionFormProps) {
  return (
    <Box>
      <SessionForm
        mode="create"
        backHref={backHref}
        onSuccess={onSuccess}
        showTopBar={true}
        useDrawerMobileFooter
      />
    </Box>
  );
}
