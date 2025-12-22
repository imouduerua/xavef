
'use server';

import type { UserData } from '@/lib/types';
// This file is now only for server-side actions that *might* be needed in the future,
// but the user lookup logic has been moved to a client-side action to use the user's
// own permissions context, which is the correct pattern for this application.
// Keeping the file structure for now.
