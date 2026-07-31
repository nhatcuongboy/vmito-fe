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

export interface LocationAutocompleteValue {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district?: string;
  city?: string;
}

interface LocationAutocompleteProps {
  onSelect: (venue: LocationAutocompleteValue) => void;
  defaultValue?: string;
  value?: string;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  inputName?: string;
  isDisabled?: boolean;
  suggestionsPlacement?: 'absolute' | 'inline';
  suggestionsMaxH?: string;
}

const LocationAutocompleteInner = ({
  onSelect,
  defaultValue = '',
  value: controlledValue,
  onInputChange,
  placeholder = 'Search for a badminton court...',
  ariaLabel,
  inputName,
  isDisabled = false,
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (controlledValue === undefined) return; // uncontrolled: don't fight typing
    if (controlledValue !== value) setValue(controlledValue, false);
  }, [controlledValue, setValue, value]);

  const handleSelect = async (
    address: string,
    placeId: string,
    mainText: string
  ) => {
    setValue(address, false);
    onInputChange?.(address);
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
    const nextValue = e.target.value;
    setValue(nextValue);
    onInputChange?.(nextValue);
  };
  const isInlineSuggestions = suggestionsPlacement === 'inline';

  // Click outside to close info
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSuggestions]);

  return (
    <Box ref={containerRef} position="relative" width="full">
      <Input
        name={inputName}
        aria-label={ariaLabel}
        autoComplete="off"
        value={value}
        onChange={handleInputCheck}
        placeholder={placeholder}
        disabled={!ready || isDisabled}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        leftElement={<MapPin color="gray" size={18} />}
      />

      {status === 'OK' && (
        <Box
          role="listbox"
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
              asChild
              px={4}
              py={3}
              cursor="pointer"
              textAlign="left"
              width="full"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
              borderBottomWidth="1px"
              _last={{ borderBottomWidth: 0 }}
            >
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() =>
                  handleSelect(
                    description,
                    place_id,
                    structured_formatting.main_text
                  )
                }
              >
                <Text fontWeight="medium" fontSize="sm">
                  {structured_formatting.main_text}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {structured_formatting.secondary_text}
                </Text>
              </button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default function LocationAutocomplete(props: LocationAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  const manualInput = (
    <Input
      name={props.inputName}
      aria-label={props.ariaLabel}
      autoComplete="off"
      value={props.onInputChange ? (props.value ?? '') : undefined}
      defaultValue={props.onInputChange ? undefined : props.defaultValue}
      onChange={(event) => props.onInputChange?.(event.target.value)}
      placeholder={props.placeholder}
      bg="white"
      _dark={{ bg: 'gray.800' }}
      disabled={props.isDisabled}
      leftElement={<MapPin color="gray" size={18} />}
    />
  );

  if (!apiKey) {
    return manualInput;
  }

  if (loadError) {
    return manualInput;
  }

  if (!isLoaded) {
    return (
      <Box p={2}>
        <Spinner size="sm" />
      </Box>
    );
  }

  return <LocationAutocompleteInner {...props} />;
}
