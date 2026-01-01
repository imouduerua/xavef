
'use client';

import { doc, runTransaction, Firestore, collection, serverTimestamp } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
