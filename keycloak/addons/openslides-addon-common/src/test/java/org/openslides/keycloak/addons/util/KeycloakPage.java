package org.openslides.keycloak.addons.util;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URIBuilder;
import org.assertj.core.api.Assertions;
import org.jetbrains.annotations.NotNull;
import org.openslides.keycloak.addons.KeycloakAuthUrlGenerator;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Map;

public class KeycloakPage {

    private final String keycloakUrl;
    private final String realmName;
    private final String clientId;
    private Map<String, Object> tokens;

    public KeycloakPage(String keycloakUrl, String realmName, String clientId) {
        this.keycloakUrl = StringUtils.stripEnd(keycloakUrl, "/");
        this.realmName = realmName;
        this.clientId = clientId;
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

    public JWTClaimsSet triggerLogin(String user, String admin) {
        String loginUrl = KeycloakAuthUrlGenerator.generate(realmName, clientId, keycloakUrl);
        try (Playwright playwright = Playwright.create()) {
            // Launch
            Page page = getPage(playwright);

            page.navigate(loginUrl);
            page.fill("input[name='username']", user);
            page.fill("input[name='password']", admin);
            page.click("button[type='submit'], input[type='submit']");
            final var redirectUrl = page.url();
            System.out.println("Redirected to: " + redirectUrl);

            try {
                final var redirectAfterLogin = extractUrlParameter(loginUrl, "redirect_uri");
                final var code = extractUrlParameter(redirectUrl, "code");

                return finalizeLogin(code, redirectAfterLogin);
            } catch (URISyntaxException e) {
                throw new RuntimeException(e);
            } catch (IOException e) {
                throw new RuntimeException(e);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ParseException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private JWTClaimsSet finalizeLogin(String code, String redirectAfterLogin) throws URISyntaxException, IOException, InterruptedException, ParseException {
        String tokenEndpoint = keycloakUrl + "/realms/" + realmName + "/protocol/openid-connect/token";

        String body = "grant_type=authorization_code" +
                "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                "&redirect_uri=" + redirectAfterLogin +
                "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8);

        // Send POST request
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(tokenEndpoint))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        final var json = new ObjectMapper().readValue(response.body(), Map.class);
        this.tokens = json;
        final var accessToken = json.get("access_token").toString();
        return SignedJWT.parse(accessToken).getJWTClaimsSet();
    }

    private static String extractUrlParameter(String redirectUrl, String parameter) throws URISyntaxException {
        return new URIBuilder(redirectUrl).getQueryParams().stream()
                .filter(param -> param.getName().equals(parameter))
                .findFirst()
                .map(NameValuePair::getValue)
                .orElseThrow(() -> new IllegalStateException("No code parameter found in redirect url"));
    }

    private static @NotNull Page getPage(Playwright playwright) {
        Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
        BrowserContext context = browser.newContext(new Browser.NewContextOptions().setIgnoreHTTPSErrors(true));
        Page page = context.newPage();
        page.setDefaultTimeout(3 * 1000);
        return page;
    }

    public void doLogoutRequest() {
        try (Playwright playwright = Playwright.create()) {
            Page page = getPage(playwright);
            page.navigate(keycloakUrl + "/realms/" + realmName + "/protocol/openid-connect/logout?id_token_hint=" + tokens.get("id_token"));
            Assertions.assertThat(page.getByText("You are logged out").count()).isPositive();
        }
    }
}

