package com.teya1337.craigslist.post;

import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.common.error.ResourceNotFoundException;
import com.teya1337.craigslist.post.entity.*;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostPublishingTests {
    private final PostRepository posts = mock(PostRepository.class);
    private final PostService service = new PostService(posts, mock(UserRepository.class));
    private final UUID ownerId = UUID.randomUUID();
    private final User owner = User.builder().id(ownerId).username("alice").build();
    private final Post post = Post.builder().id(UUID.randomUUID()).user(owner)
            .title("Original title").body("Original body").status(PostStatus.PUBLISHED)
            .createdAt(Instant.parse("2026-10-01T00:00:00Z")).build();

    private void prepare() {
        when(posts.findById(post.getId())).thenReturn(Optional.of(post));
        when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test void ownerCanUnpublishAndRepublishWithoutChangingContentOrDates() {
        prepare();
        assertThat(service.changePublication(ownerId, post.getId(), false).status()).isEqualTo(PostStatus.UNPUBLISHED);
        assertThat(service.changePublication(ownerId, post.getId(), true).status()).isEqualTo(PostStatus.PUBLISHED);
        assertThat(service.changePublication(ownerId, post.getId(), true).status()).isEqualTo(PostStatus.PUBLISHED);
        assertThat(post.getTitle()).isEqualTo("Original title");
        assertThat(post.getBody()).isEqualTo("Original body");
        assertThat(post.getCreatedAt()).isEqualTo(Instant.parse("2026-10-01T00:00:00Z"));
        assertThat(post.getEditedAt()).isNull();
        assertThat(post.getDeletedAt()).isNull();
    }

    @Test void anotherUserCannotChangePublicationAndDeletedPostsCannotBeRestored() {
        prepare();
        assertThatThrownBy(() -> service.changePublication(UUID.randomUUID(), post.getId(), false))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThat(post.getStatus()).isEqualTo(PostStatus.PUBLISHED);
        post.setStatus(PostStatus.DELETED);
        assertThatThrownBy(() -> service.changePublication(ownerId, post.getId(), true))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(posts, never()).saveAndFlush(any());
    }

    @Test void unpublishedDirectLinksAreOnlyVisibleToOwner() {
        prepare();
        post.setStatus(PostStatus.UNPUBLISHED);
        assertThat(service.findVisiblePost(post.getId(), ownerId).id()).isEqualTo(post.getId());
        assertThatThrownBy(() -> service.findVisiblePost(post.getId(), null)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.findVisiblePost(post.getId(), UUID.randomUUID())).isInstanceOf(ResourceNotFoundException.class);
        post.setStatus(PostStatus.PUBLISHED);
        assertThat(service.findVisiblePost(post.getId(), null).id()).isEqualTo(post.getId());
        post.setStatus(PostStatus.DELETED);
        assertThatThrownBy(() -> service.findVisiblePost(post.getId(), ownerId)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test void myPostsIncludeBothPublicationStatesButPublicProfileDoesNot() {
        Post unpublished = Post.builder().id(UUID.randomUUID()).user(owner).status(PostStatus.UNPUBLISHED).build();
        Post deleted = Post.builder().status(PostStatus.DELETED).build();
        when(posts.findAllByUserId(ownerId)).thenReturn(List.of(post, unpublished, deleted));
        assertThat(service.findPostsByUserId(ownerId)).hasSize(2);
        assertThat(service.findPublishedPostsByUserId(ownerId)).extracting(response -> response.id()).containsExactly(post.getId());
    }
}
