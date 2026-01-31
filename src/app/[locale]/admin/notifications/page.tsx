'use client';

import { useState } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Card,
    Input,
    Textarea,
    Button,
    Spinner,
} from '@chakra-ui/react';
import { Field } from '@chakra-ui/react';
import { LuSend, LuBell, LuUsers } from 'react-icons/lu';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toaster } from '@/components/ui/toaster';
import { NotificationService } from '@/lib/api/notification.service';

const broadcastSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
});

type TBroadcastFormData = z.infer<typeof broadcastSchema>;

export default function AdminNotificationsPage() {
    const t = useTranslations('admin');
    const tc = useTranslations('common');
    const tn = useTranslations('notification');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<TBroadcastFormData>({
        resolver: zodResolver(broadcastSchema),
        defaultValues: {
            title: '',
            message: '',
        },
    });

    const watchedTitle = watch('title');
    const watchedMessage = watch('message');

    const onSubmit = async (data: TBroadcastFormData) => {
        try {
            setIsSubmitting(true);
            const result = await NotificationService.broadcastNotification(data);

            toaster.success({
                title: tn('broadcastSuccess'),
                description: `${result.count} ${tn('usersNotified')}`,
            });

            reset();
        } catch (error) {
            console.error('Failed to broadcast notification:', error);
            toaster.error({
                title: tc('error'),
                description: tn('broadcastError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxW="container.lg" py={8}>
            <VStack gap={6} align="stretch">
                <HStack gap={3}>
                    <Box
                        p={3}
                        borderRadius="lg"
                        bg="purple.100"
                        _dark={{ bg: 'purple.900/30' }}
                        color="purple.600"
                    >
                        <LuBell size={24} />
                    </Box>
                    <Box>
                        <Heading size="lg">{tn('broadcastNotifications')}</Heading>
                        <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                            {tn('broadcastDescription')}
                        </Text>
                    </Box>
                </HStack>

                <Card.Root>
                    <Card.Body>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <VStack gap={4} align="stretch">
                                <Field.Root invalid={!!errors.title}>
                                    <Field.Label>{tn('notificationTitle')} *</Field.Label>
                                    <Input
                                        {...register('title')}
                                        placeholder={tn('titlePlaceholder')}
                                        maxLength={200}
                                    />
                                    {errors.title && (
                                        <Field.ErrorText>{errors.title.message}</Field.ErrorText>
                                    )}
                                    <Field.HelperText>
                                        {watchedTitle.length}/200
                                    </Field.HelperText>
                                </Field.Root>

                                <Field.Root invalid={!!errors.message}>
                                    <Field.Label>{tn('notificationMessage')} *</Field.Label>
                                    <Textarea
                                        {...register('message')}
                                        placeholder={tn('messagePlaceholder')}
                                        rows={4}
                                        maxLength={1000}
                                    />
                                    {errors.message && (
                                        <Field.ErrorText>{errors.message.message}</Field.ErrorText>
                                    )}
                                    <Field.HelperText>
                                        {watchedMessage.length}/1000
                                    </Field.HelperText>
                                </Field.Root>

                                {/* Preview */}
                                {(watchedTitle || watchedMessage) && (
                                    <Box
                                        p={4}
                                        borderRadius="md"
                                        bg="gray.50"
                                        _dark={{ bg: 'gray.800' }}
                                        borderWidth="1px"
                                    >
                                        <Text fontSize="sm" fontWeight="semibold" color="gray.500" mb={2}>
                                            {tn('preview')}
                                        </Text>
                                        <VStack align="start" gap={1}>
                                            <Text fontWeight="semibold">
                                                {watchedTitle || tn('notificationTitle')}
                                            </Text>
                                            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                                                {watchedMessage || tn('notificationMessage')}
                                            </Text>
                                        </VStack>
                                    </Box>
                                )}

                                <Button
                                    type="submit"
                                    colorPalette="purple"
                                    size="lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <LuSend size={18} />
                                            <LuUsers size={18} />
                                            {tn('sendToAllUsers')}
                                        </>
                                    )}
                                </Button>
                            </VStack>
                        </form>
                    </Card.Body>
                </Card.Root>
            </VStack>
        </Container>
    );
}
