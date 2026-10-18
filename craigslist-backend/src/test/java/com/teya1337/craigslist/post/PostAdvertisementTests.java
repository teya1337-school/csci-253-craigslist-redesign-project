package com.teya1337.craigslist.post;

import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.post.dto.PostRequest;
import com.teya1337.craigslist.post.entity.*;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostAdvertisementTests {
    private final PostRepository posts = mock(PostRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final PostService service = new PostService(posts, users, mock(com.teya1337.craigslist.post.picture.PostPictureRepository.class));
    private final UUID ownerId = UUID.randomUUID();
    private final User owner = User.builder().id(ownerId).username("bob").build();
    private PostRequest request(boolean advertisement) {
        return new PostRequest("Title", "Body", PostCategory.SERVICES, PostType.COMPUTER, null, advertisement);
    }
    private Post post() {
        return Post.builder().id(UUID.randomUUID()).user(owner).title("Title").body("Body")
                .category(PostCategory.SERVICES).postType(PostType.COMPUTER).status(PostStatus.UNPUBLISHED).build();
    }

    @Test void creationStoresAndReturnsAdvertisementChoiceForBothValues() {
        when(users.findById(ownerId)).thenReturn(Optional.of(owner));
        when(posts.save(any(Post.class))).thenAnswer(call -> call.getArgument(0));
        assertThat(service.createPost(ownerId, request(false)).advertisement()).isFalse();
        assertThat(service.createPost(ownerId, request(true)).advertisement()).isTrue();
    }

    @Test void changingOnlyAdvertisementMarksAnEditAndPreservesPublicationState() {
        Post post = post();
        when(posts.findById(post.getId())).thenReturn(Optional.of(post));
        when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));
        assertThat(service.updatePost(ownerId, post.getId(), request(false)).editedAt()).isNull();
        var changed = service.updatePost(ownerId, post.getId(), request(true));
        assertThat(changed.advertisement()).isTrue();
        assertThat(changed.editedAt()).isNotNull();
        assertThat(changed.status()).isEqualTo(PostStatus.UNPUBLISHED);
        assertThat(service.updatePost(ownerId, post.getId(), request(true)).editedAt()).isEqualTo(changed.editedAt());
        assertThat(service.updatePost(ownerId, post.getId(), request(false)).advertisement()).isFalse();
    }

    @Test void anotherUserCannotMarkSomeoneElsesPostAsAnAdvertisement() {
        Post post = post();
        when(posts.findById(post.getId())).thenReturn(Optional.of(post));
        assertThatThrownBy(() -> service.updatePost(UUID.randomUUID(), post.getId(), request(true)))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThat(post.isAdvertisement()).isFalse();
        verify(posts, never()).saveAndFlush(any());
    }
}
