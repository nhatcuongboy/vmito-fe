'use client';

import { Box, Text, Spinner } from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { MapPin } from 'lucide-react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useRef } from 'react';

const LIBRARIES: 'places'[] = ['places'];

interface LocationAutocompleteProps {
  onSelect: (venue: {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    district?: string;
    city?: string;
  }) => void;
  defaultValue?: string;
  placeholder?: string;
  suggestionsPlacement?: 'absolute' | 'inline';
  suggestionsMaxH?: string;
}

const LocationAutocompleteInner = ({
  onSelect,
  defaultValue = '',
  placeholder = 'Search for a badminton court...',
  suggestionsPlacement = 'absolute',
  suggestionsMaxH = '200px',
}: LocationAutocompleteProps) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'vn' }, // Limit to Vietnam for now, can be optional
      types: ['establishment', 'geocode'],
    },
    debounce: 300,
    defaultValue,
  });

  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue, false);
    }
  }, [defaultValue, setValue]);

  const handleSelect = async (
    address: string,
    placeId: string,
    mainText: string
  ) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ placeId });
      const { lat, lng } = await getLatLng(results[0]);

      // Extract district and city
      let district = '';
      let city = '';

      results[0].address_components.forEach((component) => {
        if (component.types.includes('administrative_area_level_2')) {
          district = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
      });

      onSelect({
        placeId,
        name: mainText, // Use the main name (e.g. "San Cau Long A")
        address: results[0].formatted_address,
        lat,
        lng,
        district,
        city,
      });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleInputCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  const isInlineSuggestions = suggestionsPlacement === 'inline';

  // Click outside to close info
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSuggestions]);

  return (
    <Box position="relative" width="full">
      <Input
        value={value}
        onChange={handleInputCheck}
        placeholder={placeholder}
        disabled={!ready}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        leftElement={<MapPin color="gray" size={18} />}
      />

      {status === 'OK' && (
        <Box
          ref={listRef}
          position={isInlineSuggestions ? 'static' : 'absolute'}
          zIndex={1000}
          top={isInlineSuggestions ? undefined : '100%'}
          left={isInlineSuggestions ? undefined : 0}
          right={isInlineSuggestions ? undefined : 0}
          bg="white"
          _dark={{ bg: 'gray.800' }}
          boxShadow="lg"
          borderRadius="md"
          mt={1}
          maxH={suggestionsMaxH}
          overflowY="auto"
          borderWidth="1px"
          display="flex"
          flexDirection="column"
        >
          {data.map(({ place_id, description, structured_formatting }) => (
            <Box
              key={place_id}
              px={4}
              py={3}
              cursor="pointer"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
              onClick={() =>
                handleSelect(
                  description,
                  place_id,
                  structured_formatting.main_text
                )
              }
              borderBottomWidth="1px"
              _last={{ borderBottomWidth: 0 }}
            >
              <Text fontWeight="medium" fontSize="sm">
                {structured_formatting.main_text}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {structured_formatting.secondary_text}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default function LocationAutocomplete(props: LocationAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('LocationAutocomplete', apiKey);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  if (!apiKey) {
    console.warn(
      'Google Maps API key is missing. Location search will not work.'
    );
    return (
      <Input
        placeholder="Enter location (Map API key missing)"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        disabled
        leftElement={<MapPin color="gray" size={18} />}
      />
    );
  }

  if (loadError) {
    console.error('Error loading Google Maps script:', loadError);
    return (
      <Input
        placeholder="Error loading maps"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        disabled
        leftElement={<MapPin color="gray" size={18} />}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Box p={2}>
        <Spinner size="sm" />
      </Box>
    );
  }

  console.log('Google Maps API loaded successfully');

  return <LocationAutocompleteInner {...props} />;
}
