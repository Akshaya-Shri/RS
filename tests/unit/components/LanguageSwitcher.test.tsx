import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

vi.mock('@/context/LanguageContext', () => {
  const mockSetLanguage = vi.fn();
  return {
    useLanguage: vi.fn(() => ({
      language: 'en',
      setLanguage: mockSetLanguage,
      t: (key: string) => key
    }))
  };
});

describe('LanguageSwitcher Component UI Tests', () => {
  let mockSetLanguage: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Retrieve the mock function from our vi.mock setup
    mockSetLanguage = useLanguage().setLanguage;
  });

  it('should render EN and TA buttons successfully', () => {
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN');
    const taButton = screen.getByText('TA');
    
    expect(enButton).toBeDefined();
    expect(taButton).toBeDefined();
  });

  it('should apply active brand styling (bg-primary) to the current language button', () => {
    // English is active in default mock
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN');
    const taButton = screen.getByText('TA');
    
    expect(enButton.className).toContain('bg-primary');
    expect(enButton.className).toContain('text-white');
    
    expect(taButton.className).toContain('bg-gray-200');
    expect(taButton.className).not.toContain('bg-primary');
  });

  it('should apply active brand styling to the Tamil button when active language is set to ta', () => {
    // Override mock to return 'ta' as current language
    vi.mocked(useLanguage).mockReturnValueOnce({
      language: 'ta',
      setLanguage: mockSetLanguage,
      t: (key: string) => key
    });

    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN');
    const taButton = screen.getByText('TA');
    
    expect(taButton.className).toContain('bg-primary');
    expect(taButton.className).toContain('text-white');
    
    expect(enButton.className).toContain('bg-gray-200');
    expect(enButton.className).not.toContain('bg-primary');
  });

  it('should trigger setLanguage callback with "en" when clicking EN button', () => {
    render(<LanguageSwitcher />);
    
    const enButton = screen.getByText('EN');
    fireEvent.click(enButton);
    
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  it('should trigger setLanguage callback with "ta" when clicking TA button', () => {
    render(<LanguageSwitcher />);
    
    const taButton = screen.getByText('TA');
    fireEvent.click(taButton);
    
    expect(mockSetLanguage).toHaveBeenCalledWith('ta');
  });
});
