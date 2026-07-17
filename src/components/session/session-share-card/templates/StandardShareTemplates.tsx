'use client';

import { Box, Flex, Grid, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Shield,
  SquareAsterisk,
  Ticket,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import {
  CardShell,
  CoverImage,
  DetailItem,
  LevelBadges,
  PricePill,
  QrBlock,
} from '../SessionShareCardPrimitives';
import { ISessionShareTemplateProps } from '../types';

export const ClassicCleanCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <Box p="20px">
      <CoverImage session={session} height="330px" rounded="24px" />
      <Box color="white" textAlign="center" py={7}>
        <Text fontSize="26px" fontWeight="900" textTransform="uppercase">
          Tuyển vãng lai cầu lông
        </Text>
      </Box>
      <Box bg="#ffffff" borderRadius="24px" p="44px" minH="720px">
        <Stack gap={5} maxH="520px" overflow="hidden">
          <Heading
            fontSize="42px"
            fontWeight="950"
            color={theme.primaryDark}
            textAlign="center"
            textTransform="uppercase"
            lineHeight="1.08"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="md"
            labelColor="#252833"
            theme={theme}
          />
          {data.address && (
            <Text
              pl="54px"
              mt="-24px"
              fontSize="22px"
              color="#70727d"
              fontWeight="650"
              lineHeight="1.3"
              lineClamp={2}
            >
              {data.address}
            </Text>
          )}
          <DetailItem
            icon={User}
            label={`Host: ${data.host}`}
            size="md"
            labelColor="#252833"
            theme={theme}
          />
          <Grid templateColumns="1fr 1fr" gap={6}>
            <DetailItem
              icon={Calendar}
              label={data.date}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Clock}
              label={data.time}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.courts}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Phone}
              label={data.phone}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.shuttlecock}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
          </Grid>
          <Flex align="center" gap={4}>
            <Icon as={Shield} boxSize="34px" color="#c78400" />
            <LevelBadges levels={session.requiredLevels} size="sm" />
          </Flex>
          <PricePill fee={data.fee} theme={theme} />
          {session.description && (
            <Text
              fontSize="23px"
              color="#5c5f6a"
              lineClamp={2}
              lineHeight="1.25"
            >
              {session.description}
            </Text>
          )}
        </Stack>
        <Flex
          position="absolute"
          left="64px"
          right="64px"
          bottom="50px"
          borderTop="2px solid #e3e6ea"
          pt={5}
          justify="space-between"
          align="center"
        >
          <Text
            fontSize="22px"
            color={theme.primaryDark}
            fontWeight="950"
            lineHeight="1.16"
          >
            Truy cập VMITO.COM
            <br />
            để tìm thêm nhiều kèo hot hơn
          </Text>
          {qrDataUrl && (
            <QrBlock qrDataUrl={qrDataUrl} size={88} theme={theme} />
          )}
        </Flex>
      </Box>
    </Box>
  </CardShell>
);

export const SocialPosterCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.background}>
    <Box position="absolute" inset={0} bg={theme.background} />
    <Box
      position="absolute"
      top="-120px"
      right="-180px"
      w="520px"
      h="520px"
      bg={theme.accent}
      borderRadius="999px"
    />
    <Box
      position="absolute"
      bottom="-190px"
      left="-210px"
      w="560px"
      h="560px"
      bg={theme.primary}
      borderRadius="999px"
    />
    <Box p="48px" position="relative">
      <Box borderRadius="34px" overflow="hidden" h="430px" position="relative">
        <CoverImage session={session} height="430px" />
        <Box position="absolute" left="34px" right="34px" bottom="30px">
          <PricePill fee={data.fee} size="lg" />
        </Box>
      </Box>
      <Flex mt={9} align="center" gap={4}>
        <Box
          bg={theme.primaryDark}
          color={theme.textOnPrimary}
          borderRadius="999px"
          px={6}
          py={3}
        >
          <Text fontSize="24px" fontWeight="950" textTransform="uppercase">
            Tuyển vãng lai
          </Text>
        </Box>
      </Flex>
      <Heading
        mt={6}
        fontSize="64px"
        fontWeight="950"
        lineHeight="1.08"
        color={theme.text}
        textTransform="uppercase"
        lineClamp={2}
      >
        {session.name}
      </Heading>
      <Grid templateColumns="1fr 1fr" gap={5} mt={9}>
        <DetailItem icon={Calendar} label={data.date} size="lg" theme={theme} />
        <DetailItem icon={Clock} label={data.time} size="lg" theme={theme} />
      </Grid>
      <Box
        mt={8}
        bg={theme.surface}
        borderRadius="30px"
        p={8}
        border={`3px solid ${theme.border}`}
      >
        <Stack gap={6}>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="lg"
            theme={theme}
          />
          {data.address && (
            <Text
              pl="72px"
              mt="-16px"
              fontSize="27px"
              color={theme.mutedText}
              fontWeight="700"
              lineClamp={2}
            >
              {data.address}
            </Text>
          )}
          <Grid templateColumns="1fr 1fr" gap={5}>
            <DetailItem
              icon={User}
              label={`Host: ${data.host}`}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.courts}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Phone}
              label={data.phone}
              size="md"
              theme={theme}
            />
          </Grid>
          <Flex align="center" gap={5}>
            <Icon as={Shield} boxSize="46px" color="#c78400" />
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Flex>
        </Stack>
      </Box>
      <Flex
        position="absolute"
        left="56px"
        right="56px"
        bottom="-132px"
        justify="space-between"
        align="center"
      >
        {qrDataUrl && (
          <QrBlock qrDataUrl={qrDataUrl} size={125} dark theme={theme} />
        )}
        <Text
          fontSize="25px"
          fontWeight="950"
          color={theme.text}
          textAlign="right"
        >
          VMITO
          <br />
          Tìm kèo cầu lông cực dễ
        </Text>
      </Flex>
    </Box>
  </CardShell>
);

export const StoryVerticalCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <CoverImage session={session} height="760px" />
    <Box
      position="absolute"
      inset={0}
      bg={`linear-gradient(180deg, rgba(0,0,0,0.05) 0%, ${theme.primaryDark}cc 48%, ${theme.primaryDark} 100%)`}
    />
    <Box position="absolute" inset={0} p="64px">
      <Text color="white" fontSize="30px" fontWeight="950">
        VMITO.COM
      </Text>
      <Flex
        position="absolute"
        top="550px"
        left="64px"
        right="64px"
        bottom="64px"
        direction="column"
        justify="space-between"
      >
        <Box>
          <Text
            color={theme.accent}
            fontSize="34px"
            fontWeight="950"
            textTransform="uppercase"
          >
            Tuyển vãng lai cầu lông
          </Text>
          <Heading
            mt={4}
            color="white"
            fontSize="72px"
            fontWeight="950"
            lineHeight="1.0"
            textTransform="uppercase"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <Box mt={7}>
            <PricePill fee={data.fee} size="lg" theme={theme} />
          </Box>
        </Box>
        <Box bg="white" borderRadius="36px" p={12}>
          <Stack gap={8}>
            <Grid templateColumns="1fr 1fr" gap={6}>
              <DetailItem
                icon={Calendar}
                label={data.date}
                size="lg"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Clock}
                label={data.time}
                size="lg"
                labelColor="#252833"
                theme={theme}
              />
            </Grid>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="lg"
              labelColor="#252833"
              theme={theme}
            />
            {data.address && (
              <Text
                pl="72px"
                mt="-26px"
                fontSize="28px"
                color="#70727d"
                fontWeight="700"
                lineHeight="1.22"
                lineClamp={1}
              >
                {data.address}
              </Text>
            )}
            <Grid templateColumns="1fr 1fr" gap={6}>
              <DetailItem
                icon={User}
                label={data.host}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              {data.shuttlecock && (
                <Box gridColumn="1 / -1">
                  <DetailItem
                    icon={Ticket}
                    label={data.shuttlecock}
                    size="venue"
                    labelColor="#252833"
                    theme={theme}
                  />
                </Box>
              )}
            </Grid>
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Stack>
        </Box>
        <Flex justify="space-between" align="center">
          {qrDataUrl && (
            <QrBlock qrDataUrl={qrDataUrl} size={150} dark theme={theme} />
          )}
          <Text
            color="white"
            fontSize="31px"
            fontWeight="950"
            textAlign="right"
            lineHeight="1.08"
          >
            Quét mã
            <br />
            để đăng ký kèo
          </Text>
        </Flex>
      </Flex>
    </Box>
  </CardShell>
);

export const SquareFeedCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.surface}>
    <Grid templateRows="430px 1fr" h="100%">
      <Box position="relative">
        <CoverImage session={session} height="430px" />
        <Box
          position="absolute"
          left="46px"
          bottom="-46px"
          bg={theme.accent}
          color={theme.textOnPrimary}
          borderRadius="28px"
          px={8}
          py={5}
        >
          <Text fontSize="32px" fontWeight="950">
            {data.date}
          </Text>
          <Text fontSize="26px" fontWeight="900">
            {data.time}
          </Text>
        </Box>
      </Box>
      <Flex direction="column" justify="space-between" minH={0}>
        <Box px="58px" pt="52px">
          <Text
            color={theme.accent}
            fontSize="27px"
            fontWeight="950"
            textTransform="uppercase"
          >
            Tuyển vãng lai cầu lông
          </Text>
          <Heading
            mt={3}
            fontSize="66px"
            fontWeight="950"
            lineHeight="0.98"
            color={theme.text}
            textTransform="uppercase"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <Box mt={6}>
            <PricePill fee={data.fee} theme={theme} />
          </Box>
          <Stack gap={5} mt={7}>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="md"
              theme={theme}
            />
            {data.address && (
              <Text
                pl="50px"
                mt="-12px"
                fontSize="20px"
                color={theme.mutedText}
                fontWeight="700"
                lineHeight="1.22"
                lineClamp={1}
              >
                {data.address}
              </Text>
            )}
            <DetailItem
              icon={User}
              label={`Host: ${data.host}`}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="md"
              theme={theme}
            />
            <LevelBadges levels={session.requiredLevels} size="sm" />
          </Stack>
        </Box>
        {qrDataUrl && (
          <Flex
            justify="space-between"
            align="center"
            bg={theme.primaryDark}
            px="58px"
            py="24px"
          >
            <QrBlock qrDataUrl={qrDataUrl} size={100} dark theme={theme} />
            <Text
              color="white"
              fontSize="24px"
              fontWeight="950"
              textAlign="right"
              lineHeight="1.1"
            >
              Quét mã
              <br />
              để đăng ký kèo
            </Text>
          </Flex>
        )}
      </Flex>
    </Grid>
  </CardShell>
);

export const EventPassCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <Box
      position="absolute"
      inset="32px"
      border={`3px solid ${theme.accent}`}
      borderRadius="34px"
      opacity={0.72}
    />
    <Box p="58px" position="relative" h="100%">
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={4}>
          <Icon as={Trophy} color={theme.accent} boxSize="46px" />
          <Text color="white" fontSize="30px" fontWeight="950">
            VMITO PASS
          </Text>
        </Flex>
      </Flex>
      <Box mt={9} borderRadius="30px" overflow="hidden" h="360px">
        <CoverImage
          session={session}
          height="360px"
          imageFilter="saturate(1.08) contrast(1.04)"
          overlay="linear-gradient(180deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.14) 100%)"
        />
      </Box>
      <Flex mt={9} gap={4} align="center">
        <Icon as={Ticket} color={theme.accent} boxSize="40px" />
        <Text
          color={theme.accent}
          fontSize="30px"
          fontWeight="950"
          textTransform="uppercase"
        >
          Vé tham gia kèo
        </Text>
      </Flex>
      <Heading
        mt={4}
        color="white"
        h="130px"
        fontSize="62px"
        fontWeight="950"
        lineHeight="1.02"
        textTransform="uppercase"
        lineClamp={2}
        overflowWrap="break-word"
      >
        {session.name}
      </Heading>
      <Grid templateColumns="1fr 1fr" gap={5} mt={6}>
        <Box bg="rgba(0, 0, 0, 0.22)" borderRadius="26px" p={7}>
          <DetailItem
            icon={Calendar}
            label={data.date}
            color={theme.accent}
            labelColor={theme.accent}
            size="md"
            theme={theme}
          />
        </Box>
        <Box bg="rgba(0, 0, 0, 0.22)" borderRadius="26px" p={7}>
          <DetailItem
            icon={Clock}
            label={data.time}
            color={theme.accent}
            labelColor={theme.accent}
            size="md"
            theme={theme}
          />
        </Box>
      </Grid>
      <Box mt={5} bg="white" borderRadius="30px" px={9} py={4} minH="270px">
        <Stack gap={4}>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="venue"
            lineClamp={1}
            color={theme.primary}
            labelColor="#252833"
            theme={theme}
          />
          {data.address && (
            <Text
              pl="56px"
              mt="-12px"
              fontSize="21px"
              color="#70727d"
              fontWeight="700"
              lineHeight="1.2"
              lineClamp={1}
            >
              {data.address}
            </Text>
          )}
          <Grid templateColumns="1fr 1fr" gap={5}>
            <Stack gap={4} minW={0}>
              <DetailItem
                icon={User}
                label={data.host}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <LevelBadges levels={session.requiredLevels} size="md" />
            </Stack>
            <Stack gap={4} minW={0} align="flex-start">
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <PricePill fee={data.fee} theme={theme} />
            </Stack>
          </Grid>
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
            size={104}
            dark
            showTitle={false}
            titleFontSize="24px"
            captionFontSize="21px"
            caption="Quét QR để xem kèo"
            theme={theme}
          />
        )}
        <Text
          color="white"
          fontSize="23px"
          fontWeight="950"
          textAlign="right"
          lineHeight="1.1"
        >
          Tìm thêm nhiều kèo hot
          <br />
          tại VMITO.COM
        </Text>
      </Flex>
    </Box>
  </CardShell>
);
