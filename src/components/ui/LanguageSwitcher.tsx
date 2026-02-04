'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { Button, Box, Text, Flex } from '@chakra-ui/react';
import { ChevronDown, Languages } from 'lucide-react';

const locales = [
  { code: Locale.EN, label: 'English', flag: '🇺🇸' },
  { code: Locale.VI, label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: Locale.CN, label: '中文', flag: '🇨🇳' },
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

  return (
    <Box position="relative" w="full" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
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
          <Languages size={16} />
          {!isCollapsed && (
            <Text fontSize="sm">
              {currentLocale.flag} {currentLocale.label}
            </Text>
          )}
        </Flex>
        {!isCollapsed && <ChevronDown size={16} />}
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          bottom={isCollapsed ? 'auto' : '100%'}
          top={isCollapsed ? 0 : 'auto'}
          left={isCollapsed ? 'calc(100% + 12px)' : 0}
          right={isCollapsed ? 'auto' : 0}
          mb={isCollapsed ? 0 : 2}
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          shadow="lg"
          zIndex={1000}
          overflow="hidden"
          minW={isCollapsed ? '160px' : 'full'}
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
                <Text>{loc.flag}</Text>
                <Text>{loc.label}</Text>
              </Flex>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
