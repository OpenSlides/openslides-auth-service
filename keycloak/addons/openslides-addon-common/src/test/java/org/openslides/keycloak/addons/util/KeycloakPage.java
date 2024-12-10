package org.openslides.keycloak.addons.util;

import com.microsoft.playwright.*;

public class KeycloakPage {

    private final String keycloakUrl;

    public KeycloakPage(String keycloakUrl) {
        this.keycloakUrl = keycloakUrl;
    }

    public void triggerAccountPasswordReset(String loginUrl, String username) {
        try (Playwright playwright = Playwright.create()) {
            // Launch a headless Chromium browser instance
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            BrowserContext context = browser.newContext(new Browser.NewContextOptions().setIgnoreHTTPSErrors(true));
            Page page = context.newPage();

            page.navigate(loginUrl);
            page.click("text=Forgot Password?");
            page.fill("input[name='username']", username);

            page.click("button[type='submit']");
        }
    }
}