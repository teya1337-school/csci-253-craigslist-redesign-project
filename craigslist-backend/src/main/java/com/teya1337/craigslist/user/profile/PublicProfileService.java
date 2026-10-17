package com.teya1337.craigslist.user.profile;

import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.PostService;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicProfileService {
    private final UserRepository userRepository;
    private final PostService postService;

    @Transactional(readOnly = true)
    public PublicProfileResponse findProfile(UUID userId) {
        var user = userRepository.findById(userId)
                .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        return new PublicProfileResponse(user.getId(), user.getUsername(), user.getCreatedAt(), user.getBio(), user.getPublicEmail(), user.getPublicPhoneNumber(),
                user.getPictureVersion(), postService.findPublishedPostsByUserId(userId));
    }
}
