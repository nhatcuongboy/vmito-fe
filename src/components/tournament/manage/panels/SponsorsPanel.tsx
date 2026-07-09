'use client';

import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Heart, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Sponsor, EImageCategory } from '@/lib/api/types';
import { SponsorService } from '@/lib/api/sponsor.service';
import { VModal, useModal } from '@/components/ui/VModal';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';

interface SponsorsPanelProps {
  tournamentId: string;
  sponsors: Sponsor[];
  onSponsorsChange: () => void;
}

export default function SponsorsPanel({
  tournamentId,
  sponsors,
  onSponsorsChange,
}: SponsorsPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.sponsors');

  const createModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [logoPublicId, setLogoPublicId] = useState('');
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setWebsite('');
    setLogo('');
    setLogoPublicId('');
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    resetForm();
    createModal.onOpen();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      await SponsorService.createSponsor(tournamentId, {
        name: name.trim(),
        website: website.trim() || undefined,
        logo: logo || undefined,
        logoPublicId: logoPublicId || undefined,
      });
      onSponsorsChange();
      createModal.onClose();
    } catch (error) {
      console.error('Error creating sponsor:', error);
      toaster.error({
        title: t('createFailed'),
        description: error instanceof Error ? error.message : t('unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleOpenEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setName(sponsor.name);
    setWebsite(sponsor.website ?? '');
    setLogo(sponsor.logo ?? '');
    setLogoPublicId(sponsor.logoPublicId ?? '');
    editModal.onOpen();
  };

  const handleEdit = async () => {
    if (!editingSponsor || !name.trim()) return;
    try {
      setIsSubmitting(true);
      await SponsorService.updateSponsor(editingSponsor.id, {
        name: name.trim(),
        website: website.trim() || undefined,
        logo: logo || undefined,
        logoPublicId: logoPublicId || undefined,
      });
      onSponsorsChange();
      editModal.onClose();
    } catch (error) {
      console.error('Error updating sponsor:', error);
      toaster.error({
        title: t('updateFailed'),
        description: error instanceof Error ? error.message : t('unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleOpenDelete = (sponsor: Sponsor) => {
    setDeletingSponsor(sponsor);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingSponsor) return;
    try {
      setIsSubmitting(true);
      await SponsorService.deleteSponsor(deletingSponsor.id);
      onSponsorsChange();
      deleteModal.onClose();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      toaster.error({
        title: t('deleteFailed'),
        description: error instanceof Error ? error.message : t('unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="md">{t('title')}</Heading>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenCreate}
          >
            {t('addSponsors')}
          </Button>
        </Flex>

        {sponsors.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            py={8}
            gap={3}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="gray.50"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Flex
              w="48px"
              h="48px"
              bg="pink.50"
              _dark={{ bg: 'pink.900' }}
              borderRadius="full"
              align="center"
              justify="center"
            >
              <Heart size={24} color="#D53F8C" />
            </Flex>
            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="center"
              px={4}
              _dark={{ color: 'gray.400' }}
            >
              {t('description')}
            </Text>
          </Flex>
        ) : (
          <VStack gap={0} align="stretch">
            {sponsors.map((sponsor) => (
              <Flex
                key={sponsor.id}
                py={3}
                px={2}
                align="center"
                gap={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: 'gray.50' }}
                _dark={{
                  borderColor: 'gray.700',
                  _hover: { bg: 'gray.700' },
                }}
              >
                <Flex
                  w="40px"
                  h="40px"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg="white"
                  align="center"
                  justify="center"
                  overflow="hidden"
                  flexShrink={0}
                  _dark={{ borderColor: 'gray.600', bg: 'gray.900' }}
                >
                  {sponsor.logo ? (
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      maxW="100%"
                      maxH="100%"
                      objectFit="contain"
                    />
                  ) : (
                    <Heart size={18} color="#A0AEC0" />
                  )}
                </Flex>
                <Box flex="1" minW={0}>
                  <Text fontSize="sm" fontWeight="medium" truncate>
                    {sponsor.name}
                  </Text>
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        fontSize: 'var(--chakra-font-sizes-xs)',
                        color: 'var(--chakra-colors-blue-500)',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {sponsor.website}
                      </span>
                      <ExternalLink size={12} style={{ flexShrink: 0 }} />
                    </a>
                  )}
                </Box>
                <Flex gap={1}>
                  <Box
                    as="button"
                    p={1.5}
                    borderRadius="md"
                    color="gray.400"
                    _hover={{ bg: 'gray.100', color: 'gray.600' }}
                    _dark={{
                      color: 'gray.400',
                      _hover: { bg: 'gray.700', color: 'gray.200' },
                    }}
                    onClick={() => handleOpenEdit(sponsor)}
                  >
                    <Pencil size={16} />
                  </Box>
                  <Box
                    as="button"
                    p={1.5}
                    borderRadius="md"
                    color="gray.400"
                    _hover={{ bg: 'red.50', color: 'red.500' }}
                    _dark={{
                      color: 'gray.400',
                      _hover: { bg: 'red.900', color: 'red.200' },
                    }}
                    onClick={() => handleOpenDelete(sponsor)}
                  >
                    <Trash2 size={16} />
                  </Box>
                </Flex>
              </Flex>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Create Modal */}
      <VModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title={t('createSponsor')}
        primaryActionText={t('save')}
        onPrimaryAction={handleCreate}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!name.trim()}
        secondaryActionText={t('cancel')}
      >
        <SponsorFields
          name={name}
          website={website}
          logo={logo}
          logoPublicId={logoPublicId}
          onNameChange={setName}
          onWebsiteChange={setWebsite}
          onLogoChange={(url, publicId) => {
            setLogo(url);
            setLogoPublicId(publicId);
          }}
        />
      </VModal>

      {/* Edit Modal */}
      <VModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        title={t('editSponsor')}
        primaryActionText={t('save')}
        onPrimaryAction={handleEdit}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={!name.trim()}
        secondaryActionText={t('cancel')}
      >
        <SponsorFields
          name={name}
          website={website}
          logo={logo}
          logoPublicId={logoPublicId}
          onNameChange={setName}
          onWebsiteChange={setWebsite}
          onLogoChange={(url, publicId) => {
            setLogo(url);
            setLogoPublicId(publicId);
          }}
        />
      </VModal>

      {/* Delete Confirmation Modal */}
      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title={t('deleteSponsor')}
        primaryActionText={t('delete')}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isSubmitting}
        primaryColorScheme="red"
        secondaryActionText={t('cancel')}
      >
        <Text fontSize="sm" color="gray.600">
          {t('deleteConfirm')}
        </Text>
        {deletingSponsor && (
          <Text fontSize="sm" fontWeight="semibold" mt={2}>
            &quot;{deletingSponsor.name}&quot;
          </Text>
        )}
      </VModal>
    </>
  );
}

function SponsorFields({
  name,
  website,
  logo,
  logoPublicId,
  onNameChange,
  onWebsiteChange,
  onLogoChange,
}: {
  name: string;
  website: string;
  logo: string;
  logoPublicId: string;
  onNameChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onLogoChange: (url: string, publicId: string) => void;
}) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.sponsors');

  return (
    <VStack gap={3} align="stretch">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>
          {t('nameLabel')}
        </Text>
        <Input
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </Box>

      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>
          {t('websiteLabel')}
        </Text>
        <Input
          placeholder={t('websitePlaceholder')}
          value={website}
          onChange={(e) => onWebsiteChange(e.target.value)}
        />
      </Box>

      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={1}>
          {t('logoLabel')}
        </Text>
        <AppSingleImageUpload
          value={logo}
          publicId={logoPublicId}
          category={EImageCategory.OTHER}
          alt={name || 'Sponsor logo'}
          onChange={({ url, publicId }) => onLogoChange(url, publicId ?? '')}
          onClear={() => onLogoChange('', '')}
        />
      </Box>
    </VStack>
  );
}
