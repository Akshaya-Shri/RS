import { test, expect } from '@playwright/test';

test.describe('Revathi Store E2E Browser Journey', () => {
  test('Customer Storefront & Admin Portal Dashboard Flows', async ({ page }) => {
    // 1. Visit homepage
    console.log('Navigating to homepage...');
    await page.goto('/');
    
    // Check main title is correct
    await expect(page).toHaveTitle(/Revathi Store/);
    console.log('✓ Homepage title matches.');

    // 2. Bilingual text toggling
    console.log('Toggling language switch buttons...');
    // Locate the language switcher button for Tamil (TA)
    const taButton = page.getByRole('button', { name: 'TA' });
    await taButton.click();
    
    // Check if body attribute 'data-lang' changes to 'ta'
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'ta');
    console.log('✓ Switched to Tamil.');
    
    // Switch back to English (EN)
    const enButton = page.getByRole('button', { name: 'EN' });
    await enButton.click();
    await expect(page.locator('html')).toHaveAttribute('data-lang', 'en');
    console.log('✓ Switched back to English.');

    // 3. Shop for products
    console.log('Navigating to products page...');
    await page.goto('/products');
    
    // Select first product (e.g. Groundnut Oil card)
    const firstProduct = page.locator('.lift-effect').first();
    await expect(firstProduct).toBeVisible();
    console.log('✓ Products list rendered.');

    // 4. Admin Portal Login
    console.log('Navigating to Admin login portal...');
    await page.goto('/admin/login');
    
    // Enter admin credentials (admin / admin123)
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    
    // Click submit button "Secure Sign In"
    await page.click('button[type="submit"]');
    
    // Verify redirection to admin dashboard
    console.log('Waiting for redirection to Admin Dashboard...');
    await page.waitForURL('**/admin');
    
    const dashboardHeader = page.locator('h1');
    await expect(dashboardHeader).toContainText('ERP Control Center');
    console.log('✓ Successfully logged in and reached Admin Dashboard.');
  });
});
