
import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to declare the emitter with the specific event types
declare interface ErrorEventEmitter {
  on<E extends keyof ErrorEvents>(event: E, listener: ErrorEvents[E]): this;
  off<E extends keyof ErrorEvents>(event: E, listener: ErrorEvents[E]): this;
  emit<E extends keyof ErrorEvents>(
    event: E,
    ...args: Parameters<ErrorEvents[E]>
  ): boolean;
}

class ErrorEventEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEventEmitter();
