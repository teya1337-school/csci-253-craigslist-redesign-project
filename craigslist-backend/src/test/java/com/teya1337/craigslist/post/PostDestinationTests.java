package com.teya1337.craigslist.post;

import com.teya1337.craigslist.post.dto.PostRequest;
import com.teya1337.craigslist.post.entity.*;
import com.teya1337.craigslist.post.repository.PostRepository;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostDestinationTests {
    @Test void eachCategoryHasItsExpectedValidTypesAndInvalidPairsFailValidation() {
        assertThat(PostCategory.values()).hasSize(6);
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (PostCategory category : PostCategory.values()) {
                int expectedTypeCount = category == PostCategory.COMMUNITY ? 3 : 2;
                assertThat(Arrays.stream(PostType.values()).filter(category::supports)).hasSize(expectedTypeCount);
                for (PostType type : PostType.values()) {
                    var request = new PostRequest("Title", "Body", category, type, null, false);
                    assertThat(validator.validate(request).isEmpty()).isEqualTo(category.supports(type));
                }
            }
        }
    }

    @Test void creatingAndEditingEveryDestinationPreservesItsCategoryAndType() {
        var posts = mock(PostRepository.class);
        var users = mock(UserRepository.class);
        var service = new PostService(posts, users, mock(com.teya1337.craigslist.post.picture.PostPictureRepository.class));
        var user = User.builder().id(UUID.randomUUID()).username("alice").build();
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(posts.save(any(Post.class))).thenAnswer(call -> call.getArgument(0));
        when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));
        for (PostCategory category : PostCategory.values()) {
            for (PostType type : PostType.values()) {
                if (!category.supports(type)) continue;
                var response = service.createPost(user.getId(), new PostRequest("Title", "Body", category, type, null, false));
                assertThat(response.category()).isEqualTo(category);
                assertThat(response.postType()).isEqualTo(type);
                var post = Post.builder().id(UUID.randomUUID()).user(user).category(category).postType(type)
                        .title("Title").body("Body").status(PostStatus.UNPUBLISHED).build();
                when(posts.findById(post.getId())).thenReturn(Optional.of(post));
                var updated = service.updatePost(user.getId(), post.getId(), new PostRequest("Changed", "Body", category, type, null, false));
                assertThat(updated.category()).isEqualTo(category);
                assertThat(updated.postType()).isEqualTo(type);
                assertThat(updated.status()).isEqualTo(PostStatus.UNPUBLISHED);
            }
        }
    }

    @Test void servicesRejectMismatchedCategoryAndTypeBeforeWriting() {
        var posts = mock(PostRepository.class);
        var users = mock(UserRepository.class);
        var service = new PostService(posts, users, mock(com.teya1337.craigslist.post.picture.PostPictureRepository.class));
        var invalid = new PostRequest("Title", "Body", PostCategory.JOBS, PostType.FURNITURE, null, false);
        assertThatThrownBy(() -> service.createPost(UUID.randomUUID(), invalid)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.updatePost(UUID.randomUUID(), UUID.randomUUID(), invalid)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.findPublishedPosts(PostCategory.JOBS, PostType.FURNITURE)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(posts, users);
    }
}
