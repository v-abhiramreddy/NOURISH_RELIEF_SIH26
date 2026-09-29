import { test, expect } from '@playwright/test';

// Sample 1x1 red PNG buffer for testing image file uploads
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.describe('Food Photo Replace & Upload — Demo & Sign-In Modes', () => {
  test('Demo Mode: Replace button uploads image from computer/mobile, updates preview, supports reset, and persists to NGO claim', async ({
    page,
  }) => {
    await page.goto('/restaurant/post');

    // 1. Initial State: Default stock photo and Replace button visible
    const foodPhotoSection = page.locator('section:has-text("Food Photo")');
    await expect(foodPhotoSection).toBeVisible();

    const replaceBtn = page.locator('#replaceFoodPhotoBtn');
    await expect(replaceBtn).toBeVisible();
    await expect(replaceBtn).toHaveText(/Replace/);

    const initialImg = foodPhotoSection.locator('img');
    const initialSrc = await initialImg.getAttribute('src');
    expect(initialSrc).toContain('googleusercontent.com');

    // Reset photo button should not be present initially
    await expect(page.locator('#resetFoodPhotoBtn')).toHaveCount(0);

    // 2. Upload a custom photo via file input
    const fileInput = page.locator('#foodPhotoUploadInput');
    await fileInput.setInputFiles({
      name: 'healthy_pulao_dish.png',
      mimeType: 'image/png',
      buffer: Buffer.from(SAMPLE_PNG_BASE64, 'base64'),
    });

    // 3. Verify preview updates to compressed data URL and badges appear
    await expect(page.getByText('Custom Photo Attached')).toBeVisible();
    await expect(page.getByText('healthy_pulao_dish.png')).toBeVisible();

    const updatedSrc = await initialImg.getAttribute('src');
    expect(updatedSrc).toMatch(/^data:image\/jpeg;base64,/);

    // 4. Verify Reset button appears and restores default photo
    const resetBtn = page.locator('#resetFoodPhotoBtn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify reverted
    const revertedSrc = await initialImg.getAttribute('src');
    expect(revertedSrc).toBe(initialSrc);
    await expect(page.getByText('Custom Photo Attached')).toHaveCount(0);

    // 5. Re-upload custom photo and publish donation
    await fileInput.setInputFiles({
      name: 'catering_curry_tray.png',
      mimeType: 'image/png',
      buffer: Buffer.from(SAMPLE_PNG_BASE64, 'base64'),
    });
    await expect(page.getByText('Custom Photo Attached')).toBeVisible();

    // Fill title to make it distinct
    await page.locator('#itemTitle').fill('Fresh Paneer Biryani Batch');

    // Click Publish Donation
    await page.locator('#publishBtn').click();
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();

    // 6. Navigate to NGO Claim page and verify the custom photo appears
    await page.goto('/ngo/claim');
    await expect(page.getByText('Fresh Paneer Biryani Batch').first()).toBeVisible();

    const claimBannerImg = page.locator('img[alt*="Fresh Paneer Biryani Batch"]');
    await expect(claimBannerImg).toBeVisible();
    const claimImgSrc = await claimBannerImg.getAttribute('src');
    expect(claimImgSrc).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('Sign-In Mode: Kitchen uploads photo, publishes, and photo renders on Kitchen & NGO dashboards', async ({
    page,
  }) => {
    // 1. Sign in as Kitchen in Real Mode
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-kitchen-upload-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'kitchen', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/restaurant/post');

    // 2. Upload custom food photo in Sign-In Mode
    const fileInput = page.locator('#foodPhotoUploadInput');
    await fileInput.setInputFiles({
      name: 'kitchen_chef_special.png',
      mimeType: 'image/png',
      buffer: Buffer.from(SAMPLE_PNG_BASE64, 'base64'),
    });

    await expect(page.getByText('Custom Photo Attached')).toBeVisible();
    await expect(page.getByText('kitchen_chef_special.png')).toBeVisible();

    // Set title
    await page.locator('#itemTitle').fill('Chef Special Organic Khichdi');

    // Publish
    await page.locator('#publishBtn').click();
    await expect(page.getByText('Donation Published Successfully')).toBeVisible();

    // 3. Verify Kitchen Dashboard displays the uploaded photo thumbnail in Active Batch
    await page.goto('/dashboard/kitchen');
    await expect(page.getByRole('heading', { name: 'Chef Special Organic Khichdi' })).toBeVisible();

    const kitchenThumb = page.locator('img[alt="Chef Special Organic Khichdi"]');
    await expect(kitchenThumb).toBeVisible();
    const kitchenThumbSrc = await kitchenThumb.getAttribute('src');
    expect(kitchenThumbSrc).toMatch(/^data:image\/jpeg;base64,/);

    // 4. Sign in as NGO and verify the photo displays on NGO Claim page
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'nr_auth_session', value: 'session-ngo-upload-test', domain: 'localhost', path: '/' },
      { name: 'nr_user_role', value: 'ngo', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/ngo/claim');
    await expect(page.getByText('Chef Special Organic Khichdi').first()).toBeVisible();

    const ngoImg = page.locator('img[alt*="Chef Special Organic Khichdi"]');
    await expect(ngoImg).toBeVisible();
    const ngoImgSrc = await ngoImg.getAttribute('src');
    expect(ngoImgSrc).toMatch(/^data:image\/jpeg;base64,/);
  });
});
