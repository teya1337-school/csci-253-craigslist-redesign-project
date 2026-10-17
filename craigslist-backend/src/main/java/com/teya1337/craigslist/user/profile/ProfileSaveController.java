package com.teya1337.craigslist.user.profile;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.user.picture.PictureResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProfileSaveController {
    private final ProfileSaveService profiles;

    @PutMapping(value = "/api/account/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PictureResponse save(@AuthenticationPrincipal UserPrincipal principal,
                                @Valid @RequestPart ProfileUpdateRequest profile,
                                @RequestPart(required = false) MultipartFile file,
                                @RequestParam(defaultValue = "false") boolean removePicture) {
        return profiles.save(principal.getUserId(), profile, file, removePicture);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("detail",
                exception.getReason() == null ? "We could not save your profile." : exception.getReason()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, String> tooLarge() { return Map.of("detail", "Choose a JPEG or PNG image up to 2 MB."); }
}
