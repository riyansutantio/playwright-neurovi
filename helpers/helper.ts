// helpers/auth.ts
import { Page, expect, request, APIRequestContext } from "@playwright/test";

export async function createApiContext(): Promise<APIRequestContext> {
  return await request.newContext({
    baseURL: "https://uat.api-clinic.neurovi.id",
  });
}
export async function login(page: Page, username: string, password: string) {
  await page.goto("/");
  expect(page.getByRole("heading", { name: "Log in." })).toHaveText("Log in.");
  await expect(page).toHaveURL("/login");
  await page.getByRole("textbox", { name: "Username Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "append icon" }).click();
  await page
    .getByRole("button", { name: " L O G I N " })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: "Dashboard Neurovi Clinic" })
  ).toBeVisible();
}

export async function autocomplete(
  page: Page,
  placeholder: string,
  value: string,
  isfirst: boolean
) {
  // Click the dropdown input by placeholder
  await page.getByPlaceholder(placeholder).click();

  // Type the value to filter options
  await page.getByPlaceholder(placeholder).fill(value);

  // Wait for the dropdown list and click the matching option
  if (isfirst) {
    await page.locator(".v-list-item", { hasText: value }).first().click();
  } else {
    await page.locator(".v-list-item", { hasText: value }).last().click();
  }
}

export async function list(page: Page, placeholder: string, value: string) {
  await page.getByRole("textbox", { name: placeholder }).click();

  await page.locator(".v-list-item", { hasText: value }).first().click();
}

export async function selectRadio(page: Page, groupId: string, option: string) {
  const group = page.locator(`#${groupId}`);
  await group.getByLabel(option).check({ force: true });
}

export async function loginAPI(username: string, password: string) {
  let unit = [];
  const apiContext = await createApiContext();

  const unitRequest = await apiContext.post("/master/staff/unit", {
    data: {
      nip: username,
      password: password,
    },
  });
  const unitResult = await unitRequest.json();
  unit = unitResult.data.unit[0];

  const loginRequest = await apiContext.post("/master/staff/login", {
    data: {
      nip: username,
      password: password,
      unit: unit.id_unit,
    },
  });
  if (!loginRequest.ok())
    throw new Error(`LoginRequest failed: ${loginRequest.status()}`);

  const body = await loginRequest.json();
  console.log("sucessfull login as : ", username, " as role : ", body.role[0]);
  // Save token into env
  process.env.API_TOKEN = "bearer " + body.token;

  await apiContext.dispose();
}

export function getInitials(fullName: string, skipTitles = true): string {
  let parts = fullName.trim().split(/\s+/);

  // Optional: skip known titles like drg., dr., Prof, etc.
  if (skipTitles) {
    const titles = ["drg.", "dr.", "prof.", "dr", "prof"];
    parts = parts.filter((p) => !titles.includes(p.toLowerCase()));
  }

  // Take the first letter of each remaining word
  return parts
    .filter((word) => word.length > 0)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
