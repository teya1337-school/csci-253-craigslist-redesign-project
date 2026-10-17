package com.teya1337.craigslist.account;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.user.profile.ProfileUpdateRequest;
import com.teya1337.craigslist.auth.security.ActiveAccountFilter;
import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.profile.PublicProfileService;
import com.teya1337.craigslist.post.PostService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.mock.web.MockFilterChain;
import com.teya1337.craigslist.user.entity.User;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AccountTests {
    private final UserRepository userRepository = mock(UserRepository.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final AccountService accountService = new AccountService(userRepository, passwordEncoder);
    private final User user = User.builder().id(UUID.randomUUID()).username("alice").privateEmail("alice@example.com")
            .password(passwordEncoder.encode("old-password")).build();

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    @Test void updatesTheSameUserAndReturnsNoPassword() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        UserPrincipal principal = accountService.updateAccount(user.getId(), new AccountRequest("new_alice", "new@example.com", "old-password"));
        assertThat(principal.getUserId()).isEqualTo(user.getId());
        assertThat(principal.getUsername()).isEqualTo("new_alice");
        assertThat(principal.getPrivateEmail()).isEqualTo("new@example.com");
        assertThat(principal.getPassword()).isNull();
        verify(userRepository).saveAndFlush(user);
    }

    @Test void accountChangesRequireTheCurrentPasswordBeforeCheckingAvailabilityOrSaving() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        for (String currentPassword : new String[] { "", "wrong-password" }) {
            assertThatThrownBy(() -> accountService.updateAccount(user.getId(),
                    new AccountRequest("new_alice", "new@example.com", currentPassword)))
                    .isInstanceOf(ResponseStatusException.class);
        }
        assertThat(user.getUsername()).isEqualTo("alice");
        assertThat(user.getPrivateEmail()).isEqualTo("alice@example.com");
        verify(userRepository, never()).existsByUsernameIgnoreCaseAndIdNot(any(), any());
        verify(userRepository, never()).existsByPrivateEmailIgnoreCaseAndIdNot(any(), any());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test void rejectsDuplicateNamesAndEmailsWithoutSaving() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.existsByUsernameIgnoreCaseAndIdNot("bob", user.getId())).thenReturn(true);
        assertThatThrownBy(() -> accountService.updateAccount(user.getId(), new AccountRequest("bob", "alice@example.com", "old-password")))
                .isInstanceOf(ResponseStatusException.class);
        when(userRepository.existsByPrivateEmailIgnoreCaseAndIdNot("bob@example.com", user.getId())).thenReturn(true);
        assertThatThrownBy(() -> accountService.updateAccount(user.getId(), new AccountRequest("alice", "bob@example.com", "old-password")))
                .isInstanceOf(ResponseStatusException.class);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test void requiresCorrectCurrentPasswordAndMatchingNewPasswords() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        String originalHash = user.getPassword();
        assertThatThrownBy(() -> accountService.changePassword(user.getId(), new PasswordChangeRequest("wrong", "new-password", "new-password")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> accountService.changePassword(user.getId(), new PasswordChangeRequest("old-password", "new-password", "different")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> accountService.changePassword(user.getId(), new PasswordChangeRequest("old-password", "old-password", "old-password")))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> accountService.changePassword(user.getId(), new PasswordChangeRequest("old-password", "é".repeat(40), "é".repeat(40))))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(user.getPassword()).isEqualTo(originalHash);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test void hashesTheNewPasswordAndErasesSessionCredentials() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        UserPrincipal principal = accountService.changePassword(user.getId(), new PasswordChangeRequest("old-password", "new-password", "new-password"));
        assertThat(passwordEncoder.matches("new-password", user.getPassword())).isTrue();
        assertThat(passwordEncoder.matches("old-password", user.getPassword())).isFalse();
        assertThat(principal.getPassword()).isNull();
    }

    @Test void replacesAndPersistsTheSessionPrincipalAfterRename() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        UserPrincipal original = UserPrincipal.from(user);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession();
        new AccountController(accountService).update(original, new AccountRequest("new_alice", "alice@example.com", "old-password"), request, new MockHttpServletResponse());
        SecurityContext context = (SecurityContext) request.getSession().getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
        UserPrincipal updated = (UserPrincipal) context.getAuthentication().getPrincipal();
        assertThat(updated.getUsername()).isEqualTo("new_alice");
        assertThat(updated.getUserId()).isEqualTo(original.getUserId());
        assertThat(updated.getPassword()).isNull();
        assertThat(context.getAuthentication().getCredentials()).isNull();
    }
    @Test void deletionRequiresPasswordAndExplicitConfirmation() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> accountService.deleteAccount(user.getId(), new DeleteAccountRequest("wrong", true)))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> accountService.deleteAccount(user.getId(), new DeleteAccountRequest("old-password", false)))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test void deletionDisablesLoginHidesProfileAndSignsOutCurrentSession() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        UserPrincipal principal = UserPrincipal.from(user);
        MockHttpServletRequest request = new MockHttpServletRequest();
        var session = request.getSession();
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
        new AccountController(accountService).delete(principal, new DeleteAccountRequest("old-password", true),
                request, new MockHttpServletResponse());
        assertThat(user.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(user.getPublicUsername()).isEqualTo("[deleted]");
        assertThat(UserPrincipal.from(user).isEnabled()).isFalse();
        assertThatThrownBy(() -> session.getAttribute("test")).isInstanceOf(IllegalStateException.class);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThatThrownBy(() -> new PublicProfileService(userRepository, mock(PostService.class)).findProfile(user.getId()))
                .isInstanceOf(com.teya1337.craigslist.common.error.ResourceNotFoundException.class);
        verify(userRepository).saveAndFlush(user);
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test void existingSessionsCannotKeepUsingADeletedAccount() throws Exception {
        UserPrincipal oldPrincipal = UserPrincipal.from(user);
        user.setStatus(UserStatus.INACTIVE);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        for (int sessionNumber = 0; sessionNumber < 2; sessionNumber++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            var session = request.getSession();
            SecurityContextHolder.getContext().setAuthentication(
                    UsernamePasswordAuthenticationToken.authenticated(oldPrincipal, null, oldPrincipal.getAuthorities()));
            new ActiveAccountFilter(userRepository).doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
            assertThatThrownBy(() -> session.getAttribute("test")).isInstanceOf(IllegalStateException.class);
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        }
    }

    @Test void profileChangesRequirePasswordAndNeverOverwritePrivateInformationOrUsername() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> accountService.updateProfile(user.getId(),
                new ProfileUpdateRequest("bio", "public@example.com", "555-1234", "wrong")))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(user.getBio()).isNull();
        verify(userRepository, never()).saveAndFlush(any());
        accountService.updateProfile(user.getId(), new ProfileUpdateRequest(" About me ", "public@example.com", "555-1234", "old-password"));
        assertThat(user.getBio()).isEqualTo("About me");
        assertThat(user.getPublicEmail()).isEqualTo("public@example.com");
        assertThat(user.getPublicPhoneNumber()).isEqualTo("555-1234");
        assertThat(user.getPrivateEmail()).isEqualTo("alice@example.com");
        assertThat(user.getUsername()).isEqualTo("alice");
        accountService.updateProfile(user.getId(), new ProfileUpdateRequest("", "", "", "old-password"));
        assertThat(user.getBio()).isNull();
        assertThat(user.getPublicEmail()).isNull();
        assertThat(user.getPublicPhoneNumber()).isNull();
    }

}
