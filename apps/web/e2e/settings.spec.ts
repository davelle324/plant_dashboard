import { test, expect } from "@playwright/test";

test.describe("Settings page", () => {
  test("loads without error", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Account & preferences")).toBeVisible();
  });

  test("shows account section in local dev mode", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Account")).toBeVisible();
    await expect(page.getByText("Mode")).toBeVisible();
    // Without Clerk keys, mode is always local dev
    await expect(page.getByText("Local dev (no auth)")).toBeVisible();
    await expect(page.getByText("dev-user")).toBeVisible();
  });

  test("shows plant defaults section", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Plant defaults")).toBeVisible();
    await expect(page.getByText("Default watering interval")).toBeVisible();
  });

  test("shows notifications placeholder", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Notifications")).toBeVisible();
  });

  test("shows AI assistant placeholder", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("AI assistant")).toBeVisible();
    await expect(page.getByText(/POST \/ai\/ask/)).toBeVisible();
  });

  test("back to dashboard link works", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("link", { name: "Back to dashboard" }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
