import { Center, CenterProps, Spinner, SpinnerProps } from '@chakra-ui/react';
import React from 'react';

interface LoadingSpinnerProps extends CenterProps {
  spinnerProps?: SpinnerProps;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  spinnerProps,
  ...props
}) => {
  return (
    <Center py={10} {...props}>
      <Spinner size="xl" color="blue.500" {...spinnerProps} />
    </Center>
  );
};

export default LoadingSpinner;
