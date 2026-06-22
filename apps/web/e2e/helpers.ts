import { type Page, expect } from "@playwright/test";

/** Creates a plant via the dashboard form and returns its name. */
export async function createPlant(page: Page, name: string) {
  await page.goto("/dashboard");
  await page.getByPlaceholder("Plant name").fill(name);
  await page.getByPlaceholder("Species").fill("Test species");
  await page.getByPlaceholder("Location").fill("Test location");
  await page.getByRole("button", { name: "Add plant" }).click();
  await expect(page.getByText(name)).toBeVisible();
}

/** Deletes a plant by name from the dashboard. Accepts the confirm dialog. */
export async function deletePlantByName(page: Page, name: string) {
  await page.goto("/dashboard");
  const card = page.locator("div.rounded-2xl", { hasText: name });
  page.on("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(name)).not.toBeVisible();
}
