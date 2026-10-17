package com.teya1337.craigslist.auth.service;

import com.teya1337.craigslist.auth.dto.SignupRequest;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SignupTests {
    private final UserRepository users = mock(UserRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final SignupService service = new SignupService(users, encoder);

    @Test void createsActiveAccountWithHashedPasswordAndNoPublicContactInformation() {
        service.signup(new SignupRequest("new_user", "private@example.test", "test-password", "test-password"));
        var capture = ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(capture.capture());
        User user = capture.getValue();
        assertThat(user.getUsername()).isEqualTo("new_user");
        assertThat(user.getPrivateEmail()).isEqualTo("private@example.test");
        assertThat(user.getPassword()).isNotEqualTo("test-password");
        assertThat(encoder.matches("test-password", user.getPassword())).isTrue();
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getPublicEmail()).isNull();
        assertThat(user.getPublicPhoneNumber()).isNull();
        assertThat(user.getBio()).isNull();
        assertThat(user.getPictureVersion()).isNull();
        assertThat(user.getPrivatePhoneNumber()).isEmpty();
        assertThat(user.getAddress()).isEmpty();
    }

    @Test void rejectsDuplicateUsernameOrEmailWithoutSaving() {
        when(users.existsByUsernameIgnoreCase("ALICE")).thenReturn(true);
        assertThatThrownBy(() -> service.signup(new SignupRequest("ALICE", "new@example.test", "test-password", "test-password")))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("username is already in use");
        when(users.existsByPrivateEmailIgnoreCase("TAKEN@example.test")).thenReturn(true);
        assertThatThrownBy(() -> service.signup(new SignupRequest("another", "TAKEN@example.test", "test-password", "test-password")))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("email is already in use");
        verify(users, never()).saveAndFlush(any());
    }

    @Test void rejectsMismatchedPasswordsAndTheBcryptByteLimit() {
        assertThatThrownBy(() -> service.signup(new SignupRequest("new_user", "new@example.test", "test-password", "different-password")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.signup(new SignupRequest("new_user", "new@example.test", "é".repeat(40), "é".repeat(40))))
                .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(users);
    }

    @Test void requestValidationRejectsMissingOrInvalidFields() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertThat(validator.validate(new SignupRequest("x!", "invalid", "short", ""))).isNotEmpty();
            assertThat(validator.validate(new SignupRequest("valid_user", "valid@example.test", "ab", "ab"))).isNotEmpty();
            assertThat(validator.validate(new SignupRequest("valid_user", "valid@example.test", "bob", "bob"))).isEmpty();
        }
    }
}
