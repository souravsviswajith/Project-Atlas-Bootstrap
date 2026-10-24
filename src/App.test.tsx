// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Atlas plan UI", () => {
  it("labels the feature as preview-only and never represents checklist selection as installation", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: /Choose capabilities and preview prerequisites/i })).toBeTruthy();
    expect(screen.getByText(/no native provisioning provider yet/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Generate deterministic preview/i }));
    expect(screen.getByRole("heading", { name: /Plan:.*3 steps/ })).toBeTruthy();
    expect(screen.getByText(/“Planned” means a candidate only—not installed, detected, compatible, or verified/i)).toBeTruthy();
    expect(screen.getByText(/No install execution or observed-machine verification exists/i)).toBeTruthy();
  });

  it("offers labelled platform choices and accessible capability selection", async () => {
    const user = userEvent.setup();
    render(<App />);
    const os = screen.getByRole("combobox", { name: /Target operating system/i });
    await user.selectOptions(os, "linux");
    expect(screen.getByRole("combobox", { name: /Linux distribution family/i })).toBeTruthy();
    await user.click(screen.getByText(/Select from \d+ catalogued capabilities/i));
    const details = screen.getByText(/Select from \d+ catalogued capabilities/i).closest("details");
    expect(details).toBeTruthy();
    const options = within(details as HTMLElement);
    const java = options.getByRole("checkbox", { name: /Java JDK/ });
    await user.click(java);
    expect((java as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("button", { name: /Generate deterministic preview/i }));
    expect(screen.getAllByText(/Explicitly requested/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Provider candidate: apt/).length).toBeGreaterThan(0);
  });

  it("provides keyboard-operable phase navigation and labelled checklist controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navToggle = screen.getByRole("button", { name: "Toggle navigation" });
    expect(navToggle.getAttribute("aria-controls")).toBe("phase-navigation");
    expect(navToggle.getAttribute("aria-expanded")).toBe("false");
    navToggle.focus();
    await user.keyboard("{Enter}");
    expect(navToggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("checkbox", { name: /Set your Git user name/i })).toBeTruthy();
  });
});
