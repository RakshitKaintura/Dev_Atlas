package devAtlas.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.HexFormat;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.TextEncryptor;

@Configuration
public class CryptoConfig {

    @Bean
    TextEncryptor tokenEncryptor(
            @Value("${app.token-encryptor-password}") String password,
            @Value("${app.token-encryptor-salt}") String salt) {
        return new AesGcmTextEncryptor(password, salt);
    }

    private static final class AesGcmTextEncryptor implements TextEncryptor {

        private static final int GCM_TAG_BITS = 128;
        private static final int NONCE_BYTES = 12;
        private static final int KEY_BITS = 256;
        private static final int PBKDF2_ITERATIONS = 310_000;

        private final SecretKeySpec key;
        private final SecureRandom random = new SecureRandom();
        private final HexFormat hex = HexFormat.of();

        private AesGcmTextEncryptor(String password, String salt) {
            this.key = deriveKey(password, salt);
        }

        @Override
        public String encrypt(String text) {
            try {
                byte[] nonce = new byte[NONCE_BYTES];
                random.nextBytes(nonce);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
                byte[] ciphertext = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));
                byte[] result = new byte[nonce.length + ciphertext.length];
                System.arraycopy(nonce, 0, result, 0, nonce.length);
                System.arraycopy(ciphertext, 0, result, nonce.length, ciphertext.length);
                return hex.formatHex(result);
            } catch (GeneralSecurityException exception) {
                throw new IllegalStateException("Unable to encrypt token", exception);
            }
        }

        @Override
        public String decrypt(String encryptedText) {
            try {
                byte[] input = hex.parseHex(encryptedText);
                if (input.length <= NONCE_BYTES) {
                    throw new IllegalArgumentException("Invalid encrypted token");
                }
                byte[] nonce = new byte[NONCE_BYTES];
                byte[] ciphertext = new byte[input.length - NONCE_BYTES];
                System.arraycopy(input, 0, nonce, 0, nonce.length);
                System.arraycopy(input, nonce.length, ciphertext, 0, ciphertext.length);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
                return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
            } catch (GeneralSecurityException | IllegalArgumentException exception) {
                throw new IllegalStateException("Unable to decrypt token", exception);
            }
        }

        private static SecretKeySpec deriveKey(String password, String salt) {
            PBEKeySpec keySpec = new PBEKeySpec(
                    password.toCharArray(),
                    salt.getBytes(StandardCharsets.UTF_8),
                    PBKDF2_ITERATIONS,
                    KEY_BITS);
            try {
                byte[] secret = javax.crypto.SecretKeyFactory
                        .getInstance("PBKDF2WithHmacSHA256")
                        .generateSecret(keySpec)
                        .getEncoded();
                return new SecretKeySpec(secret, "AES");
            } catch (GeneralSecurityException exception) {
                throw new IllegalStateException("Unable to derive token encryption key", exception);
            } finally {
                keySpec.clearPassword();
            }
        }
    }
}
