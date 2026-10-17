package com.teya1337.craigslist.user.profile;

import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.PostService;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicProfileServiceTests {
    private final UserRepository users = mock(UserRepository.class);
    private final PostService posts = mock(PostService.class);
    private final PublicProfileService service = new PublicProfileService(users, posts);

    @Test void profileUsesOnlyPublicFields() {
        UUID id = UUID.randomUUID();
        Instant joined = Instant.parse("2026-10-01T00:00:00Z");
        when(users.findById(id)).thenReturn(Optional.of(User.builder().id(id).username("alice")
                .createdAt(joined).privateEmail("private@example.test").privatePhoneNumber("private phone")
                .bio("About Alice").publicEmail("public@example.test").publicPhoneNumber("555-123-4567")
                .address("private address").password("private password").build()));
        when(posts.findPublishedPostsByUserId(id)).thenReturn(List.of());
        var result = service.findProfile(id);
        assertThat(result.username()).isEqualTo("alice");
        assertThat(result.memberSince()).isEqualTo(joined);
        assertThat(result.posts()).isEmpty();
        assertThat(result.bio()).isEqualTo("About Alice");
        assertThat(result.publicEmail()).isEqualTo("public@example.test");
        assertThat(result.publicPhoneNumber()).isEqualTo("555-123-4567");
        assertThat(Arrays.stream(PublicProfileResponse.class.getRecordComponents()).map(c -> c.getName()))
                .containsExactly("id", "username", "memberSince", "bio", "publicEmail", "publicPhoneNumber", "pictureVersion", "posts");
    }

    @Test void unknownAndInactiveProfilesAreUnavailable() {
        UUID id = UUID.randomUUID();
        when(users.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findProfile(id)).isInstanceOf(ResourceNotFoundException.class);
        when(users.findById(id)).thenReturn(Optional.of(User.builder().id(id).status(UserStatus.INACTIVE).build()));
        assertThatThrownBy(() -> service.findProfile(id)).isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(posts);
    }
}
