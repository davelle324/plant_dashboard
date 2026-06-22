import { test, expect } from "@playwright/test";
import { createPlant, deletePlantByName } from "./helpers";

// Unique suffix so parallel runs against the same DB don't collide
const RUN = Date.now();

test.describe("Dashboard", () => {
  test("loads without error", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Your plants, health, and reminders")).toBeVisible();
    await expect(page.getByText("Plants tracked")).toBeVisible();
    await expect(page.getByText("Overdue reminders")).toBeVisible();
  });

  test("shows the add-plant form", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByPlaceholder("Plant name")).toBeVisible();
    await expect(page.getByPlaceholder("Species")).toBeVisible();
    await expect(page.getByPlaceholder("Location")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add plant" })).toBeVisible();
  });

  test("create plant → appears in recent activity", async ({ page }) => {
    const name = `Playwright Basil ${RUN}`;
    await page.goto("/dashboard");
    await page.getByPlaceholder("Plant name").fill(name);
    await page.getByPlaceholder("Species").fill("Ocimum basilicum");
    await page.getByPlaceholder("Location").fill("Kitchen window");
    await page.getByRole("button", { name: "Add plant" }).click();
    // Toast appears
    await expect(page.getByText("Plant added")).toBeVisible();
    // Plant card appears in Recent activity
    await expect(page.getByText(name)).toBeVisible();
  });

  test("delete plant → disappears from recent activity", async ({ page }) => {
    const name = `Playwright Delete Me ${RUN}`;
    await createPlant(page, name);

    await page.goto("/dashboard");
    const card = page.locator("div.rounded-2xl", { hasText: name });
    await expect(card).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("deleted")).toBeVisible(); // toast
    await expect(page.getByText(name)).not.toBeVisible();
  });

  test("stats increment after adding a plant", async ({ page }) => {
    const name = `Playwright Stats ${RUN}`;

    await page.goto("/dashboard");
    const before = Number(
      await page.locator("article").filter({ hasText: "Plants tracked" }).locator("p.text-3xl").textContent()
    );

    await createPlant(page, name);

    await page.goto("/dashboard");
    const after = Number(
      await page.locator("article").filter({ hasText: "Plants tracked" }).locator("p.text-3xl").textContent()
    );
    expect(after).toBe(before + 1);

    // Cleanup
    await deletePlantByName(page, name);
  });

  test("settings link is present", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("edit link navigates to plant detail", async ({ page }) => {
    const name = `Playwright Nav ${RUN}`;
    await createPlant(page, name);

    await page.goto("/dashboard");
    const card = page.locator("div.rounded-2xl", { hasText: name });
    await card.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/plant\/\d+/);
    await expect(page.getByText("Plant detail")).toBeVisible();

    // Cleanup
    await deletePlantByName(page, name);
  });
});
