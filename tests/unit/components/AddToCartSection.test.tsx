import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AddToCartSection from '@/components/ui/AddToCartSection';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => {
  const mockPush = vi.fn();
  return {
    useRouter: vi.fn(() => ({
      push: mockPush
    }))
  };
});

vi.mock('@/components/cart/CartProvider', () => {
  const mockAddItem = vi.fn();
  return {
    useCart: vi.fn(() => ({
      addItem: mockAddItem
    }))
  };
});

vi.mock('@/context/LanguageContext', () => {
  return {
    useLanguage: vi.fn(() => ({
      t: (key: string) => {
        const trans: Record<string, string> = {
          'products.addToCart': 'Add to Cart',
          'products.outOfStock': 'Out of Stock',
          'products.selectSize': 'Select Size',
          'products.totalFor': 'Total: {qty} x {size}'
        };
        return trans[key] || key;
      }
    }))
  };
});

describe('AddToCartSection Component UI Tests', () => {
  const mockProduct = {
    id: 10,
    slug: 'sesame-oil',
    name: 'Pure Sesame Oil',
    image: '/images/sesame.png',
    sizes: ['500ml', '1L', '5L'],
    pricePerLiter: 300,
    available: true
  };

  let mockAddItem: any;
  let mockPush: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddItem = useCart().addItem;
    mockPush = useRouter().push;
  });

  it('should render product sizes, quantity controls, and default price', () => {
    render(<AddToCartSection product={mockProduct} />);
    
    // Check sizes rendering
    expect(screen.getByText('500ml')).toBeDefined();
    expect(screen.getByText('1L')).toBeDefined();
    expect(screen.getByText('5L')).toBeDefined();
    
    // Default size is 1L. Price multiplier is 1. Price is 300.
    expect(screen.getByText('₹300')).toBeDefined();
    
    // Quantity controls render default as 1
    expect(screen.getByText('1')).toBeDefined();
  });

  it('should increment and decrement quantity when clicking + and - buttons', () => {
    render(<AddToCartSection product={mockProduct} />);
    
    const plusButton = screen.getByText('+');
    const minusButton = screen.getByText('-');
    
    // Click plus twice (quantity becomes 3)
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('₹900')).toBeDefined(); // 300 * 3
    
    // Click minus once (quantity becomes 2)
    fireEvent.click(minusButton);
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('₹600')).toBeDefined(); // 300 * 2
  });

  it('should update price when a different size is selected', () => {
    render(<AddToCartSection product={mockProduct} />);
    
    const size500ml = screen.getByText('500ml');
    fireEvent.click(size500ml);
    
    // 500ml multiplier is 0.55 -> 300 * 0.55 = 165
    expect(screen.getByText('₹165')).toBeDefined();
    
    const size5L = screen.getByText('5L');
    fireEvent.click(size5L);
    // 5L multiplier is 4.8 -> 300 * 4.8 = 1440
    expect(screen.getByText('₹1440')).toBeDefined();
  });

  it('should invoke addItem context callback and navigate to cart page on Add to Cart click', () => {
    render(<AddToCartSection product={mockProduct} />);
    
    const addToCartBtn = screen.getByText('Add to Cart');
    fireEvent.click(addToCartBtn);
    
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith({
      id: 'sesame-oil-1L',
      slug: 'sesame-oil',
      name: 'Pure Sesame Oil',
      size: '1L',
      price: 300,
      image: '/images/sesame.png',
      qty: 1,
      product_id: 10
    });
    
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('should disable inputs and show Out of Stock if the product is unavailable', () => {
    render(<AddToCartSection product={{ ...mockProduct, available: false }} />);
    
    // Check out of stock text is rendered
    expect(screen.getByText('Out of Stock')).toBeDefined();
    
    const plusButton = screen.getByText('+');
    const minusButton = screen.getByText('-');
    const addToCartBtn = screen.getByText('Out of Stock');
    
    // Verify buttons are disabled
    expect(plusButton.disabled).toBe(true);
    expect(minusButton.disabled).toBe(true);
    expect(addToCartBtn.disabled).toBe(true);
  });
});
