package org.openslides.keycloak.addons.emailtemplateprovider.snippets;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.*;
import com.nimbusds.jwt.*;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;

public class NimbusExample {
    public static void main(String[] args) throws Exception {
        // Generate an RSA key pair
        KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
        keyPairGen.initialize(2048);
        KeyPair keyPair = keyPairGen.generateKeyPair();

        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();

        // Create the JWT claims set
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer("https://example.com")
                .subject("user123")
                .audience("client-id")
                .issueTime(new Date())
                .expirationTime(new Date(System.currentTimeMillis() + 3600 * 1000)) // 1 hour
                .build();

        // Create the signed JWT
        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("123").build(),
                claimsSet
        );

        // Sign the JWT
        JWSSigner signer = new RSASSASigner(privateKey);
        signedJWT.sign(signer);

        // Serialize to compact form
        String jwtString = signedJWT.serialize();
        System.out.println("Signed JWT: " + jwtString);

        // Verifying the JWT (example)
        SignedJWT parsedJWT = SignedJWT.parse(jwtString);
        JWSVerifier verifier = new RSASSAVerifier(publicKey);
        boolean isValid = parsedJWT.verify(verifier);
        System.out.println("Is JWT valid? " + isValid);
    }
}
