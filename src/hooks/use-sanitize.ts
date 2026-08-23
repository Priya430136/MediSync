import { useCallback } from 'react';
import DOMPurify from 'dompurify';

export const useSanitize = () => {
  const sanitize = useCallback((input: string) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML allowed for most inputs
      ALLOWED_ATTR: []
    });
  }, []);

  const sanitizeHTML = useCallback((html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }, []);

  return { sanitize, sanitizeHTML };
};
