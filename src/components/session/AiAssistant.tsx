import { useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  Heading,
  useDisclosure,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import {
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerContent,
  Card,
  CardBody,
} from '@/components/ui/chakra-v3-compat';
import {
  Sparkles,
  RefreshCw,
  Smartphone,
  Users,
  MonitorPlay,
  X,
} from 'lucide-react';
import { api, ApiResponse } from '@/lib/api/base';
import { toaster } from '@/components/ui/toaster';

interface TaskSuggestion {
  title: string;
  description: string;
  type: 'CREATE_MATCH' | 'MOVE_PLAYER' | 'OTHER';
  reason: string;
}

export default function AiAssistant({ sessionId }: { sessionId: string }) {
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [tasks, setTasks] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<TaskSuggestion[]>>(
        `/sessions/${sessionId}/tasks/suggest`
      );
      if (response.data.data) {
        setTasks(response.data.data);
      }
      setHasFetched(true);
    } catch (error) {
      console.error('Failed to fetch AI tasks', error);
      toaster.create({
        title: 'Failed to get suggestions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    onOpen();
    if (!hasFetched) {
      fetchSuggestions();
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'CREATE_MATCH':
        return <MonitorPlay size={18} />;
      case 'MOVE_PLAYER':
        return <Users size={18} />;
      default:
        return <Smartphone size={18} />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'CREATE_MATCH':
        return 'green';
      case 'MOVE_PLAYER':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <Box position="fixed" bottom="90px" right="4" zIndex="1000">
        <IconButton
          aria-label="AI Assistant"
          onClick={handleOpen}
          colorPalette="purple"
          size="xl"
          rounded="full"
          boxShadow="lg"
        >
          <Sparkles />
        </IconButton>
      </Box>

      {isOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          bg="blackAlpha.600"
          zIndex="999"
          onClick={onClose}
        />
      )}

      {isOpen && (
        <Drawer isOpen={isOpen} onClose={onClose}>
          <DrawerContent bg="white" boxShadow="xl" height="100%">
            <DrawerHeader borderBottomWidth="1px">
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <Sparkles color="purple" />
                  <Text>AI Assistant</Text>
                </Flex>
                <IconButton
                  aria-label="Close"
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                >
                  <X size={20} />
                </IconButton>
              </Flex>
            </DrawerHeader>

            <DrawerBody bg="gray.50" p={4}>
              {loading ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="200px"
                  gap={4}
                >
                  <Spinner size="xl" color="purple.500" />
                  <Text color="gray.500">Analyzing session...</Text>
                </Flex>
              ) : tasks.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="200px"
                  gap={4}
                >
                  <Text color="gray.500">No suggestions at the moment.</Text>
                  <Button
                    size="sm"
                    onClick={fetchSuggestions}
                    variant="outline"
                  >
                    Analyze Again
                  </Button>
                </Flex>
              ) : (
                <VStack gap={4} align="stretch">
                  {tasks.map((task, index) => (
                    <Card key={index} variant="outline" bg="white" shadow="sm">
                      <CardBody p={4}>
                        <Flex justify="space-between" align="start" mb={2}>
                          <Heading size="sm" fontSize="md">
                            {task.title}
                          </Heading>
                          <Badge colorPalette={getColorForType(task.type)}>
                            {task.type.replace('_', ' ')}
                          </Badge>
                        </Flex>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          {task.description}
                        </Text>
                        <Box
                          bg="purple.50"
                          p={2}
                          rounded="md"
                          fontSize="xs"
                          color="purple.700"
                        >
                          <strong>Why:</strong> {task.reason}
                        </Box>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </DrawerBody>

            <DrawerFooter borderTopWidth="1px">
              <Button variant="outline" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button
                colorPalette="purple"
                onClick={fetchSuggestions}
                loading={loading}
              >
                <RefreshCw size={16} style={{ marginRight: '8px' }} />
                Refresh
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
