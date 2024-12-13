package org.openslides.keycloak.addons.util;

import com.microsoft.playwright.*;
import org.jetbrains.annotations.NotNull;

public class KeycloakPage {

    private final String keycloakUrl;

    public KeycloakPage(String keycloakUrl) {
        this.keycloakUrl = keycloakUrl;
    }

    public void triggerAccountPasswordReset(String loginUrl, String username) {
        try (Playwright playwright = Playwright.create()) {
            // Launch a headless Chromium browser instance
            Page page = getPage(playwright);

            page.navigate(loginUrl);
            page.click("text=Forgot Password?");
            page.fill("input[name='username']", username);

            page.click("button[type='submit'], input[type='submit']");
        }
    }

    public void triggerLogin(String loginUrl, String user, String admin) {
        try (Playwright playwright = Playwright.create()) {
            // Launch
            Page page = getPage(playwright);

            page.navigate(loginUrl);
            page.fill("input[name='username']", user);
            page.fill("input[name='password']", admin);
            page.click("button[type='submit'], input[type='submit']");
        }
    }

    private static @NotNull Page getPage(Playwright playwright) {
        Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
        BrowserContext context = browser.newContext(new Browser.NewContextOptions().setIgnoreHTTPSErrors(true));
        Page page = context.newPage();
        page.setDefaultTimeout(3 * 1000);
        return page;
    }
}

