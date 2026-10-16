package com.teya1337.craigslist.user.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PublicProfileController {
    private final PublicProfileService profileService;

    @GetMapping("/{userId}/profile")
    public PublicProfileResponse findProfile(@PathVariable UUID userId) {
        return profileService.findProfile(userId);
    }
}
