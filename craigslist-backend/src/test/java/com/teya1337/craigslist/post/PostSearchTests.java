package com.teya1337.craigslist.post;

import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostSearchTests {
    private final PostRepository posts = mock(PostRepository.class);
    private final PostService service = new PostService(posts, mock(UserRepository.class));

    @Test void blankAndShortQueriesDoNotFetchPosts() {
        assertThat(service.searchPosts("   ").posts()).isEmpty();
        assertThat(service.searchPosts("a").total()).isZero();
        verifyNoInteractions(posts);
    }

    @Test void rejectsQueriesOverTheLimit() {
        assertThatThrownBy(() -> service.searchPosts("x".repeat(201))).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(posts);
    }

    @Test void searchesOnlyPublishedPostsAndPreservesTheTotal() {
        var author = User.builder().id(UUID.randomUUID()).username("bob").build();
        var post = Post.builder().id(UUID.randomUUID()).user(author).title("Weekend events").body("Fresno events")
                .status(PostStatus.PUBLISHED).build();
        when(posts.searchPublishedPosts("weekend", PostStatus.PUBLISHED, PageRequest.of(0, 50)))
                .thenReturn(new PageImpl<>(List.of(post), PageRequest.of(0, 50), 80));
        var result = service.searchPosts(" weekend ");
        assertThat(result.total()).isEqualTo(80);
        assertThat(result.posts()).extracting(item -> item.title()).containsExactly("Weekend events");
        verify(posts).searchPublishedPosts("weekend", PostStatus.PUBLISHED, PageRequest.of(0, 50));
    }
}
