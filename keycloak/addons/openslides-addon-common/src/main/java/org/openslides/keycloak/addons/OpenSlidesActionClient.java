package org.openslides.keycloak.addons;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.openslides.keycloak.addons.action.HttpResponse;
import org.openslides.keycloak.addons.action.OsAction;

import java.util.HashMap;
import java.util.Map;

public class OpenSlidesActionClient {

    private String contextUrl;

    public OpenSlidesActionClient(String contextUrl) {
        this.contextUrl = contextUrl;
    }

    public <REQ, RESP, ACTION extends OsAction<REQ, RESP>> HttpResponse<RESP> execute(ACTION osAction, REQ requestData) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            String url = contextUrl + "/system/action/handle_request";

            // Prepare the payload
            Map<String, Object> payload = new HashMap<>();
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("action", osAction.getActionName());
            actionData.put("data", actionData);
            payload.put("data", actionData);

            ObjectMapper objectMapper = new ObjectMapper();
            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(jsonPayload));

            try (CloseableHttpResponse response = httpClient.execute(post)) {
                // Check the response and parse JSON
                String responseString = EntityUtils.toString(response.getEntity());
                return new HttpResponse<>(objectMapper.readValue(responseString, osAction.getResponseType()));
            }
        }
    }
}
