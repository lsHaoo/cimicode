import type { Page } from "@playwright/test"
import { test, expect } from "../fixtures"
import { closeDialog, openSettings } from "../actions"
import { listItemKeySelector, promptModelSelector } from "../selectors"

async function openCustomProvider(page: Page) {
  const settings = await openSettings(page)
  await settings.getByRole("tab", { name: "Providers" }).click()

  const customProviderSection = settings.locator('[data-component="custom-provider-section"]')
  await expect(customProviderSection).toBeVisible()
  await customProviderSection.getByRole("button", { name: "Connect" }).click()

  const providerDialog = page.getByRole("dialog").filter({ has: page.getByText("Custom provider") })
  await expect(providerDialog).toBeVisible()
  return { settings, providerDialog }
}

async function createCustomProvider(
  page: Page,
  input: {
    providerID: string
    name: string
    baseURL: string
    apiKey?: string
    modelID: string
    modelName: string
  },
) {
  const { settings, providerDialog } = await openCustomProvider(page)

  await providerDialog.getByLabel("Provider ID").fill(input.providerID)
  await providerDialog.getByLabel("Display name").fill(input.name)
  await providerDialog.getByLabel("Base URL").fill(input.baseURL)
  if (input.apiKey) await providerDialog.getByLabel("API key").fill(input.apiKey)
  await providerDialog.getByPlaceholder("model-id").first().fill(input.modelID)
  await providerDialog.getByPlaceholder("Display Name").first().fill(input.modelName)
  await providerDialog.getByRole("button", { name: /submit|save/i }).click()
  await expect(providerDialog).toHaveCount(0)

  return settings
}

test("custom provider form can be filled and validates input", async ({ page, gotoSession }) => {
  await gotoSession()

  const { settings, providerDialog } = await openCustomProvider(page)

  await providerDialog.getByLabel("Provider ID").fill("test-provider")
  await providerDialog.getByLabel("Display name").fill("Test Provider")
  await providerDialog.getByLabel("Base URL").fill("http://localhost:9999/fake")
  await providerDialog.getByLabel("API key").fill("fake-key")

  await providerDialog.getByPlaceholder("model-id").first().fill("test-model")
  await providerDialog.getByPlaceholder("Display Name").first().fill("Test Model")

  await expect(providerDialog.getByRole("textbox", { name: "Provider ID" })).toHaveValue("test-provider")
  await expect(providerDialog.getByRole("textbox", { name: "Display name" })).toHaveValue("Test Provider")
  await expect(providerDialog.getByRole("textbox", { name: "Base URL" })).toHaveValue("http://localhost:9999/fake")
  await expect(providerDialog.getByRole("textbox", { name: "API key" })).toHaveValue("fake-key")
  await expect(providerDialog.getByPlaceholder("model-id").first()).toHaveValue("test-model")
  await expect(providerDialog.getByPlaceholder("Display Name").first()).toHaveValue("Test Model")

  await page.keyboard.press("Escape")
  await expect(providerDialog).toHaveCount(0)

  await closeDialog(page, settings)
})

test("custom provider form shows validation errors", async ({ page, gotoSession }) => {
  await gotoSession()

  const { settings, providerDialog } = await openCustomProvider(page)

  await providerDialog.getByLabel("Provider ID").fill("invalid provider id")
  await providerDialog.getByLabel("Base URL").fill("not-a-url")

  await providerDialog.getByRole("button", { name: /submit|save/i }).click()

  await expect(providerDialog.locator('[data-slot="input-error"]').filter({ hasText: /lowercase/i })).toBeVisible()
  await expect(providerDialog.locator('[data-slot="input-error"]').filter({ hasText: /http/i })).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(providerDialog).toHaveCount(0)

  await closeDialog(page, settings)
})

test("custom provider form can add and remove models", async ({ page, gotoSession }) => {
  await gotoSession()

  const { settings, providerDialog } = await openCustomProvider(page)

  await providerDialog.getByLabel("Provider ID").fill("multi-model-test")
  await providerDialog.getByLabel("Display name").fill("Multi Model Test")
  await providerDialog.getByLabel("Base URL").fill("http://localhost:9999/multi")

  await providerDialog.getByPlaceholder("model-id").first().fill("model-1")
  await providerDialog.getByPlaceholder("Display Name").first().fill("Model 1")

  const idInputsBefore = await providerDialog.getByPlaceholder("model-id").count()
  await providerDialog.getByRole("button", { name: "Add model" }).click()
  const idInputsAfter = await providerDialog.getByPlaceholder("model-id").count()
  expect(idInputsAfter).toBe(idInputsBefore + 1)

  await providerDialog.getByPlaceholder("model-id").nth(1).fill("model-2")
  await providerDialog.getByPlaceholder("Display Name").nth(1).fill("Model 2")

  await expect(providerDialog.getByPlaceholder("model-id").nth(1)).toHaveValue("model-2")
  await expect(providerDialog.getByPlaceholder("Display Name").nth(1)).toHaveValue("Model 2")

  await page.keyboard.press("Escape")
  await expect(providerDialog).toHaveCount(0)

  await closeDialog(page, settings)
})

test("custom provider form can add and remove headers", async ({ page, gotoSession }) => {
  await gotoSession()

  const { settings, providerDialog } = await openCustomProvider(page)

  await providerDialog.getByLabel("Provider ID").fill("header-test")
  await providerDialog.getByLabel("Display name").fill("Header Test")
  await providerDialog.getByLabel("Base URL").fill("http://localhost:9999/headers")

  await providerDialog.getByPlaceholder("model-id").first().fill("model-x")
  await providerDialog.getByPlaceholder("Display Name").first().fill("Model X")

  const headerInputsBefore = await providerDialog.getByPlaceholder("Header-Name").count()
  await providerDialog.getByRole("button", { name: "Add header" }).click()
  const headerInputsAfter = await providerDialog.getByPlaceholder("Header-Name").count()
  expect(headerInputsAfter).toBe(headerInputsBefore + 1)

  await providerDialog.getByPlaceholder("Header-Name").first().fill("Authorization")
  await providerDialog.getByPlaceholder("value").first().fill("Bearer token123")

  await expect(providerDialog.getByPlaceholder("Header-Name").first()).toHaveValue("Authorization")
  await expect(providerDialog.getByPlaceholder("value").first()).toHaveValue("Bearer token123")

  await page.keyboard.press("Escape")
  await expect(providerDialog).toHaveCount(0)

  await closeDialog(page, settings)
})

test("custom providers can be edited from settings without changing their provider ID", async ({ page, gotoSession }) => {
  await gotoSession()

  const settings = await createCustomProvider(page, {
    providerID: "editable-provider",
    name: "Editable Provider",
    baseURL: "http://localhost:9999/original",
    apiKey: "secret",
    modelID: "model-1",
    modelName: "Model 1",
  })

  const connected = settings.locator('[data-component="connected-providers-section"]')
  await expect(connected.getByText("Editable Provider")).toBeVisible()
  await connected.getByRole("button", { name: "Edit" }).click()

  const providerDialog = page.getByRole("dialog").filter({ has: page.getByText("Edit custom provider") })
  await expect(providerDialog).toBeVisible()
  await expect(providerDialog.getByLabel("Provider ID")).toHaveValue("editable-provider")
  await expect(providerDialog.getByLabel("Provider ID")).toHaveAttribute("readonly", "")
  await expect(providerDialog.getByLabel("Display name")).toHaveValue("Editable Provider")
  await expect(providerDialog.getByLabel("Base URL")).toHaveValue("http://localhost:9999/original")
  await expect(providerDialog.getByLabel("API key")).toHaveValue("secret")
  await expect(providerDialog.getByPlaceholder("model-id").first()).toHaveValue("model-1")
  await expect(providerDialog.getByPlaceholder("Display Name").first()).toHaveValue("Model 1")

  await providerDialog.getByLabel("Display name").fill("Edited Provider")
  await providerDialog.getByLabel("Base URL").fill("http://localhost:9999/edited")
  await providerDialog.getByRole("button", { name: "Add model" }).click()
  await providerDialog.getByPlaceholder("model-id").nth(1).fill("model-2")
  await providerDialog.getByPlaceholder("Display Name").nth(1).fill("Model 2")
  await providerDialog.getByRole("button", { name: /save/i }).click()
  await expect(providerDialog).toHaveCount(0)

  await expect(connected.getByText("Edited Provider")).toBeVisible()
  await connected.getByRole("button", { name: "Edit" }).click()

  const reopened = page.getByRole("dialog").filter({ has: page.getByText("Edit custom provider") })
  await expect(reopened).toBeVisible()
  await expect(reopened.getByPlaceholder("model-id").nth(1)).toHaveValue("model-2")
  await expect(reopened.getByPlaceholder("Display Name").nth(1)).toHaveValue("Model 2")

  await page.keyboard.press("Escape")
  await expect(reopened).toHaveCount(0)
  await closeDialog(page, settings)
})

test("model selector shows edit only for the current custom provider", async ({ page, gotoSession }) => {
  await gotoSession()

  const model = page.locator(promptModelSelector)
  await model.click()
  await expect(page.getByRole("button", { name: "Edit current custom provider" })).toHaveCount(0)
  await page.keyboard.press("Escape")

  const settings = await createCustomProvider(page, {
    providerID: "picker-provider",
    name: "Picker Provider",
    baseURL: "http://localhost:9999/picker",
    modelID: "model-1",
    modelName: "Picker Model",
  })
  await closeDialog(page, settings)

  await model.click()
  const item = page.locator(listItemKeySelector("picker-provider:model-1")).first()
  await expect(item).toBeVisible()
  await item.click()

  await model.click()
  const edit = page.getByRole("button", { name: "Edit current custom provider" })
  await expect(edit).toBeVisible()
  await edit.click()

  const providerDialog = page.getByRole("dialog").filter({ has: page.getByText("Edit custom provider") })
  await expect(providerDialog).toBeVisible()
  await expect(providerDialog.getByLabel("Provider ID")).toHaveValue("picker-provider")
  await expect(providerDialog.getByLabel("Display name")).toHaveValue("Picker Provider")

  await page.keyboard.press("Escape")
  await expect(providerDialog).toHaveCount(0)
})
