package com.teya1337.craigslist.post;

import com.teya1337.craigslist.common.error.ForbiddenOperationException;
import com.teya1337.craigslist.post.dto.PostRequest;
import com.teya1337.craigslist.post.entity.Post;
import com.teya1337.craigslist.post.entity.PostCategory;
import com.teya1337.craigslist.post.entity.PostStatus;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PostServiceTests {

    @Test
    void updatePostRejectsAUserWhoDoesNotOwnThePost() {
        PostRepository postRepository = mock(PostRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PostService postService = new PostService(postRepository, userRepository);

        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        User owner = User.builder().id(ownerId).build();
        Post post = Post.builder()
                .id(postId)
                .user(owner)
                .status(PostStatus.PUBLISHED)
                .build();

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostRequest request = new PostRequest(
                "Updated title",
                "Updated body",
                PostCategory.COMMUNITY,
                com.teya1337.craigslist.post.entity.PostType.GENERAL,
                "Fresno, CA"
        );

        assertThatThrownBy(() -> postService.updatePost(otherUserId, postId, request))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessage("You can only change your own posts");
    }

    @Test
    void editDateOnlyChangesWhenPostFieldsChange() {
        PostRepository posts = mock(PostRepository.class);
        UserRepository users = mock(UserRepository.class);
        PostService service = new PostService(posts, users);
        UUID ownerId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).username("alice").build();
        Post post = Post.builder().id(postId).user(owner).title("Title").body("Body")
                .category(PostCategory.COMMUNITY)
                .postType(com.teya1337.craigslist.post.entity.PostType.GENERAL).location(null).build();
        when(posts.findById(postId)).thenReturn(Optional.of(post));
        when(posts.saveAndFlush(org.mockito.ArgumentMatchers.any(Post.class)))
                .thenAnswer(call -> call.getArgument(0));
        PostRequest same = new PostRequest("Title", "Body", PostCategory.COMMUNITY,
                com.teya1337.craigslist.post.entity.PostType.GENERAL, " ");
        org.assertj.core.api.Assertions.assertThat(service.updatePost(ownerId, postId, same).editedAt()).isNull();
        PostRequest changed = new PostRequest("Title", "Changed body", PostCategory.COMMUNITY,
                com.teya1337.craigslist.post.entity.PostType.GENERAL, null);
        var edited = service.updatePost(ownerId, postId, changed);
        org.assertj.core.api.Assertions.assertThat(edited.editedAt()).isNotNull();
        var unchanged = service.updatePost(ownerId, postId, changed);
        org.assertj.core.api.Assertions.assertThat(unchanged.editedAt()).isEqualTo(edited.editedAt());
    }

    @Test void publicProfilePostsExcludeNonPublicContentAndSortNewestFirst() {
        PostRepository posts = mock(PostRepository.class);
        UserRepository users = mock(UserRepository.class);
        PostService service = new PostService(posts, users);
        UUID userId = UUID.randomUUID();
        User owner = User.builder().id(userId).username("bob").build();
        Post older = Post.builder().id(UUID.randomUUID()).user(owner).title("Older")
                .status(PostStatus.PUBLISHED).createdAt(java.time.Instant.parse("2026-10-01T00:00:00Z")).build();
        Post newer = Post.builder().id(UUID.randomUUID()).user(owner).title("Newer")
                .status(PostStatus.PUBLISHED).createdAt(java.time.Instant.parse("2026-10-02T00:00:00Z")).build();
        Post hidden = Post.builder().status(PostStatus.HIDE).build();
        Post deleted = Post.builder().status(PostStatus.DELETED).build();
        Post draft = Post.builder().status(PostStatus.DRAFT).build();
        when(posts.findAllByUserId(userId)).thenReturn(java.util.List.of(hidden, older, deleted, newer, draft));
        org.assertj.core.api.Assertions.assertThat(service.findPublishedPostsByUserId(userId))
                .extracting(com.teya1337.craigslist.post.dto.PostResponse::title).containsExactly("Newer", "Older");
        org.mockito.Mockito.verify(posts).findAllByUserId(userId);
    }
}
