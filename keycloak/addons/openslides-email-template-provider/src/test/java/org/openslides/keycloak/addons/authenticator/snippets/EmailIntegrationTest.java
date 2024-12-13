package org.openslides.keycloak.addons.authenticator.snippets;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.openslides.keycloak.addons.authenticator.models.EmailItem;
import org.openslides.keycloak.addons.authenticator.models.MailHogResponse;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.util.Properties;
import jakarta.mail. *;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

@Testcontainers
public class EmailIntegrationTest {

    @Container
    private static GenericContainer<?> mailHogContainer = new GenericContainer<>("mailhog/mailhog:latest")
            .withExposedPorts(8025, 1025);

    private static HttpClient client;
    private static String mailHogBaseUrl;
    private static ObjectMapper objectMapper;

    @BeforeAll
    public static void setUp() {
        client = HttpClient.newHttpClient();
        objectMapper = new ObjectMapper();
        mailHogContainer.start();
        String ipAddress = mailHogContainer.getHost();
        Integer httpPort = mailHogContainer.getMappedPort(8025);
        mailHogBaseUrl = String.format("http://%s:%d/api/v2/messages", ipAddress, httpPort);
    }

    @Test
    void testEmailWasSent() {
        

// Prepare properties for the email
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
//        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "localhost");
        Integer smtpPort = mailHogContainer.getMappedPort(1025);
        props.put("mail.smtp.port", smtpPort);

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("user@example.com", "password");
            }
        });

        try {
            // Create a new email message
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("from@example.com"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse("user@example.com"));
            message.setSubject("Test Email");
            message.setText("Hello, this is a test email.");

            // Send the message
            Transport.send(message);

            System.out.println("Email sent successfully!");

        } catch (MessagingException e) {
            e.printStackTrace();
        }
        
        try {
            

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mailHogBaseUrl))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            MailHogResponse mailHogResponse = objectMapper.readValue(response.body(), MailHogResponse.class);

            // Assertions to verify email content
            assertNotNull(mailHogResponse);
            assertTrue(mailHogResponse.total() > 0);

            EmailItem email = mailHogResponse.items().get(0);
            assertNotNull(email);
            assertTrue(email.content().body().contains("Hello, this is a test email."));
            assertTrue(email.content().headers().to().stream().anyMatch(to -> to.contains("user@example.com")));

        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}