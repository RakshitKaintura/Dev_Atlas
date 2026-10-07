package devAtlas.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(
            Map.of(
                "status", "online",
                "message", "DevAtlas API is running successfully!",
                "version", "1.0.0"
            )
        );
    }
}
