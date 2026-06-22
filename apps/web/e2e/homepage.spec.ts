import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders stat cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Plants tracked")).toBeVisible();
    await expect(page.getByText("Overdue reminders")).toBeVisible();
    await expect(page.getByText("Reminder coverage")).toBeVisible();
  });

  test("stat values are numbers, not placeholders", async ({ page }) => {
    await page.goto("/");
    // Values should be digits or a percentage — not the old hardcoded "12", "34" etc.
    const cards = page.locator("article");
    for (const card of await cards.all()) {
      const value = await card.locator("p.text-3xl").textContent();
      expect(value).toMatch(/^\d+%?$/);
    }
  });

  test("shows At a glance section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("At a glance")).toBeVisible();
  });

  test("Open dashboard link navigates to /dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Open dashboard" }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
