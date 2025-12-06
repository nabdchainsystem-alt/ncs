import { useState, useEffect, useRef, useCallback } from 'react';

type QuickActionOptions = {
    /** Callback when the user presses Enter */
    onConfirm?: () => void;
    /** Callback when the user clicks outside or presses Escape */
    onCancel?: () => void;
    /** Whether the action starts as active. Default is false. */
    initialActive?: boolean;
};

/**
 * A hook to manage quick temporary actions (like confirmation menus).
 * 
 * Behavior:
 * - "Enter" key -> Triggers onConfirm
 * - "Escape" key -> Triggers onCancel
 * - Click outside the ref element -> Triggers onCancel
 */
export function useQuickAction<T extends HTMLElement>({
    onConfirm,
    onCancel,
    initialActive = false,
}: QuickActionOptions = {}) {
    const [isActive, setIsActive] = useState(initialActive);
    const ref = useRef<T>(null);

    const startAction = useCallback(() => {
        setIsActive(true);
    }, []);

    const stopAction = useCallback(() => {
        setIsActive(false);
    }, []);

    useEffect(() => {
        if (!isActive) return;

        const handleClickOutside = (event: MouseEvent) => {
            // If clicking inside the element, do nothing
            if (ref.current && ref.current.contains(event.target as Node)) {
                return;
            }
            // Clicked outside
            if (onCancel) onCancel();
            setIsActive(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if any
                if (onConfirm) onConfirm();
                setIsActive(false);
            } else if (event.key === 'Escape') {
                if (onCancel) onCancel();
                setIsActive(false);
            }
        };

        // Use mousedown for quicker response than click, also standard for "click outside"
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, onConfirm, onCancel]);

    return {
        ref,
        isActive,
        startAction,
        stopAction,
        setIsActive,
    };
}
