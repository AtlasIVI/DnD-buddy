import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for auto-saving data with debounced updates.
 */
export function useAutoSave<T extends Record<string, any>>(
  initialData: T | null,
  onSave: (field: keyof T, value: any) => Promise<void>,
  delay: number = 600
): {
  localData: T | null;
  setLocalData: React.Dispatch<React.SetStateAction<T | null>>;
  updateField: (field: keyof T, value: any) => void;
  saving: boolean;
} {
  const [localData, setLocalData] = useState<T | null>(initialData);
  const [saving, setSaving] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync local data when initial data changes
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, []);

  const updateField = useCallback((field: keyof T, value: any) => {
    if (!localData) return;
    
    // Update local state immediately
    setLocalData(prev => prev ? { ...prev, [field]: value } : prev);
    
    // Clear existing timer for this field
    if (saveTimers.current[field as string]) {
      clearTimeout(saveTimers.current[field as string]);
    }
    
    // Set new timer for debounced save
    saveTimers.current[field as string] = setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(field, value);
      } finally {
        setSaving(false);
      }
    }, delay);
  }, [localData, onSave, delay]);

  return { localData, setLocalData, updateField, saving };
}