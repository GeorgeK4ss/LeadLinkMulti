import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-is-mobile';

describe('useIsMobile hook', () => {
  beforeEach(() => {
    // Reset to desktop size before each test
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  it('should return false for desktop viewport', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile viewport', () => {
    // Set viewport to mobile size
    window.innerWidth = 375;
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should update when window is resized', () => {
    const { result } = renderHook(() => useIsMobile());
    
    // Initially desktop
    expect(result.current).toBe(false);
    
    // Resize to mobile
    act(() => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));
    });
    
    // Should update to mobile
    expect(result.current).toBe(true);
    
    // Resize back to desktop
    act(() => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
    
    // Should update to desktop
    expect(result.current).toBe(false);
  });

  it('should use custom breakpoint when provided', () => {
    // Test with custom breakpoint of 900px
    const { result } = renderHook(() => useIsMobile(900));
    
    // 1024px is wider than 900px, so should be desktop
    expect(result.current).toBe(false);
    
    // Set to 800px which is narrower than 900px
    act(() => {
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));
    });
    
    // Should now be considered mobile
    expect(result.current).toBe(true);
  });
}); 