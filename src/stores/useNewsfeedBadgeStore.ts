import { UsersService } from '@/lib/api/users.service';
import { createNewsfeedBadgeStore } from './createNewsfeedBadgeStore';

export const useNewsfeedBadgeStore = createNewsfeedBadgeStore(UsersService);
