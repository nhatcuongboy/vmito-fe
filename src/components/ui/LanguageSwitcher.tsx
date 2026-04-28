'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { Box, Text, Flex, Image } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { ChevronDown, Languages } from 'lucide-react';

const locales = [
  { code: Locale.EN, label: 'English', countryCode: 'us' },
  { code: Locale.VI, label: 'Tiếng Việt', countryCode: 'vn' },
  { code: Locale.CN, label: '中文', countryCode: 'cn' },
];

type LanguageSwitcherProps = {
  keepDrawerOpen?: boolean;
  isCollapsed?: boolean;
};

export default function LanguageSwitcher({
  keepDrawerOpen = false,
  isCollapsed = false,
}: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      // Replace the current locale in the pathname
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);

      // Preserve search params
      const queryString = searchParams.toString();
      const fullUrl = queryString
        ? `${newPathname}?${queryString}`
        : newPathname;

      router.replace(fullUrl);
    });
    setIsOpen(false);

    // Nếu keepDrawerOpen là true, sau khi navigation xong, mở lại drawer
    if (keepDrawerOpen) {
      setTimeout(() => {
        // Dispatch custom event để mở lại drawer
        window.dispatchEvent(new CustomEvent('reopenDrawer'));
      }, 500);
    }
  };

  const handleCycleLocale = () => {
    const currentIndex = locales.findIndex((l) => l.code === locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    handleLocaleChange(locales[nextIndex].code);
  };

  const handleClick = () => {
    if (isCollapsed) {
      handleCycleLocale();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Box position="relative" w="full" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        gap={2}
        w="full"
        bg="bg"
        px={isCollapsed ? 0 : 3}
        borderColor="border"
        _hover={{ bg: 'bg.muted' }}
      >
        <Flex align="center" gap={2}>
          {isCollapsed ? (
            <Image
              src={`https://flagcdn.com/${currentLocale.countryCode}.svg`}
              alt={currentLocale.label}
              w="20px"
              h="15px"
              objectFit="cover"
              borderRadius="sm"
            />
          ) : (
            <Languages size={16} />
          )}
          {!isCollapsed && (
            <Flex align="center" gap={2}>
              <Image
                src={`https://flagcdn.com/${currentLocale.countryCode}.svg`}
                alt={currentLocale.label}
                w="18px"
                h="13px"
                objectFit="cover"
                borderRadius="xs"
              />
              <Text fontSize="sm">{currentLocale.label}</Text>
            </Flex>
          )}
        </Flex>
        {!isCollapsed && <ChevronDown size={16} />}
      </Button>

      {isOpen && !isCollapsed && (
        <Box
          position="absolute"
          bottom="100%"
          left={0}
          right={0}
          mb={2}
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          shadow="lg"
          zIndex={1000}
          overflow="hidden"
          minW="full"
        >
          {locales.map((loc) => (
            <Box
              key={loc.code}
              px={4}
              py={2}
              cursor="pointer"
              bg={locale === loc.code ? 'bg.muted' : 'transparent'}
              _hover={{ bg: 'bg.muted' }}
              onClick={() => handleLocaleChange(loc.code)}
            >
              <Flex align="center" gap={2}>
                <Image
                  src={`https://flagcdn.com/${loc.countryCode}.svg`}
                  alt={loc.label}
                  w="18px"
                  h="13px"
                  objectFit="cover"
                  borderRadius="xs"
                />
                <Text>{loc.label}</Text>
              </Flex>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
