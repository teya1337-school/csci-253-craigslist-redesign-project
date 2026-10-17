package com.teya1337.craigslist.user.picture;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProfilePictureController {
    private final ProfilePictureService pictures;

    @GetMapping("/api/users/{userId}/picture")
    public ResponseEntity<byte[]> find(@PathVariable UUID userId) {
        var picture = pictures.find(userId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(picture.getContentType()))
                .header("X-Content-Type-Options", "nosniff")
                .body(picture.getImageData());
    }
}
