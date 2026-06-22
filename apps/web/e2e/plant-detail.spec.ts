import { test, expect } from "@playwright/test";
import { createPlant, deletePlantByName } from "./helpers";

const RUN = Date.now();

test.describe("Plant detail page", () => {
  let plantName: string;

  test.beforeAll(async ({ browser }) => {
    plantName = `Playwright Detail ${RUN}`;
    const page = await browser.newPage();
    await createPlant(page, plantName);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deletePlantByName(page, plantName);
    await page.close();
  });

  async function goToDetail(page: Parameters<typeof createPlant>[0]) {
    await page.goto("/dashboard");
    const card = page.locator("div.rounded-2xl", { hasText: plantName });
    await card.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/plant\/\d+/);
  }

  test("shows health summary with computed indicator", async ({ page }) => {
    await goToDetail(page);
    await expect(page.getByText("Health summary")).toBeVisible();
    await expect(page.getByText("Last watered")).toBeVisible();
    await expect(page.getByText("Days since last care")).toBeVisible();
    // Indicator must be one of the three valid states
    const indicator = page.locator("dd").filter({ hasText: /^(Healthy|Due soon|Overdue)$/ });
    await expect(indicator).toBeVisible();
  });

  test("shows edit plant form", async ({ page }) => {
    await goToDetail(page);
    await expect(page.getByText("Edit plant")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  test("add a care log → appears in history", async ({ page }) => {
    await goToDetail(page);
    await page.getByRole("combobox").selectOption("watering");
    await page.getByPlaceholder("Optional note").fill("Playwright watering test");
    await page.getByRole("button", { name: "Add log" }).click();
    await expect(page.getByText("Log added")).toBeVisible();
    await expect(page.getByText("watering: Playwright watering test")).toBeVisible();
  });

  test("delete a care log → disappears from history", async ({ page }) => {
    await goToDetail(page);
    // Add a log first so we have something to delete
    await page.getByRole("combobox").selectOption("pruning");
    await page.getByPlaceholder("Optional note").fill("Delete me");
    await page.getByRole("button", { name: "Add log" }).click();
    await expect(page.getByText("Log added")).toBeVisible();

    const logCard = page.locator("div.rounded-2xl", { hasText: "pruning: Delete me" });
    await expect(logCard).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await logCard.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Log deleted")).toBeVisible();
    await expect(logCard).not.toBeVisible();
  });

  test("dates render as readable strings not ISO", async ({ page }) => {
    await goToDetail(page);
    // ISO dates contain 'T' — readable formatted dates do not
    const dateTexts = await page.locator("dd").allTextContents();
    const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
    for (const text of dateTexts) {
      expect(text).not.toMatch(isoPattern);
    }
  });
});
