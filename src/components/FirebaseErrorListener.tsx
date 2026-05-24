'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In a real development environment, this could trigger a full-screen overlay.
      // For now, we use the toast system to show the developer the context.
      toast({
        variant: 'destructive',
        title: 'Firestore Permission Denied',
        description: `Path: ${error.context.path} | Op: ${error.context.operation}`,
      });
      
      // Log for the developer
      console.error('Security Rule Violation:', error.context);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
