'use client';

import { Box, Flex, Grid, Heading, Image, Stack, Text } from '@chakra-ui/react';
import { MapPin, Phone, SquareAsterisk, User, Users } from 'lucide-react';
import { AI_BACKGROUND_URLS } from '../config';
import {
  CardShell,
  DetailItem,
  LevelBadges,
  PricePill,
  QrBlock,
} from '../SessionShareCardPrimitives';
import { ISessionShareTemplateProps, SessionShareTemplateId } from '../types';

export const AiBackgroundCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
  variant,
}: ISessionShareTemplateProps & {
  variant: Extract<
    SessionShareTemplateId,
    'ai-neon-stadium' | 'ai-yellow-smash'
  >;
}) => {
  const isYellow = variant === 'ai-yellow-smash';
  const accent = isYellow ? '#facc15' : theme.accent;
  const panelBg = isYellow ? 'rgba(17, 17, 17, 0.78)' : 'rgba(8, 17, 31, 0.76)';
  const panelBorder = isYellow
    ? 'rgba(250, 204, 21, 0.55)'
    : 'rgba(56, 189, 248, 0.34)';

  return (
    <CardShell id={id} meta={meta} bg={isYellow ? '#111111' : '#07111f'}>
      <Image
        src={AI_BACKGROUND_URLS[variant]}
        alt={session.name}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        crossOrigin="anonymous"
      />
      <Box
        position="absolute"
        inset={0}
        bg={
          isYellow
            ? 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.56) 45%, rgba(0,0,0,0.84) 100%)'
            : 'linear-gradient(180deg, rgba(3,7,18,0.16) 0%, rgba(3,7,18,0.44) 48%, rgba(3,7,18,0.88) 100%)'
        }
      />
      <Box position="relative" h="100%" p="58px">
        <Flex justify="space-between" align="center">
          <Box
            bg={isYellow ? '#facc15' : 'rgba(34, 197, 94, 0.9)'}
            color={isYellow ? '#111111' : 'white'}
            borderRadius="999px"
            px={6}
            py={3}
          >
            <Text fontSize="24px" fontWeight="950" textTransform="uppercase">
              Tuyển vãng lai
            </Text>
          </Box>
          {data.fee && <PricePill fee={data.fee} size="lg" theme={theme} />}
        </Flex>

        <Box position="absolute" left="58px" right="58px" top="405px">
          <Text
            color={accent}
            fontSize="31px"
            fontWeight="950"
            textTransform="uppercase"
          >
            {data.date} · {data.time}
          </Text>
          <Heading
            mt={4}
            color="white"
            fontSize="74px"
            fontWeight="950"
            lineHeight="0.98"
            textTransform="uppercase"
            lineClamp={3}
            overflowWrap="break-word"
          >
            {session.name}
          </Heading>
        </Box>

        <Box
          position="absolute"
          left="58px"
          right="58px"
          bottom="210px"
          bg={panelBg}
          border={`2px solid ${panelBorder}`}
          borderRadius="34px"
          p={8}
          color="white"
          backdropFilter="blur(2px)"
        >
          <Stack gap={5}>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="venue"
              color={accent}
              labelColor="white"
              lineClamp={1}
              theme={theme}
            />
            {data.address && (
              <Text
                pl="56px"
                mt="-12px"
                fontSize="21px"
                color="whiteAlpha.800"
                fontWeight="700"
                lineHeight="1.2"
                lineClamp={1}
              >
                {data.address}
              </Text>
            )}
            <Grid templateColumns="1fr 1fr" gap={5}>
              <DetailItem
                icon={User}
                label={data.host}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
            </Grid>
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Stack>
        </Box>

        <Flex
          position="absolute"
          left="58px"
          right="58px"
          bottom="54px"
          justify="space-between"
          align="center"
        >
          {qrDataUrl && (
            <QrBlock
              qrDataUrl={qrDataUrl}
              size={122}
              dark
              caption="Quét QR để xem kèo"
              theme={theme}
            />
          )}
          <Text
            color="white"
            fontSize="25px"
            fontWeight="950"
            textAlign="right"
            lineHeight="1.1"
          >
            VMITO.COM
            <br />
            Tìm kèo cầu lông cực dễ
          </Text>
        </Flex>
      </Box>
    </CardShell>
  );
};
