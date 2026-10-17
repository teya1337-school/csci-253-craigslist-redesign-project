package com.teya1337.craigslist.auth.controller;

import com.teya1337.craigslist.auth.dto.AuthenticatedUserResponse;
import com.teya1337.craigslist.auth.dto.CsrfTokenResponse;
import com.teya1337.craigslist.auth.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import com.teya1337.craigslist.user.repository.UserRepository;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@RestController
public class AuthController {
    private final UserRepository userRepository;

    @PostMapping("/login")
    public AuthenticatedUserResponse login(
            @NonNull @AuthenticationPrincipal UserPrincipal principal
    ) {
        log.debug("User signed in. username={}", principal.getUsername());
        return toResponse(principal);
    }

    @GetMapping("/me")
    public AuthenticatedUserResponse currentUser(
            @NonNull @AuthenticationPrincipal UserPrincipal principal
    ) {
        return toResponse(UserPrincipal.from(userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))));
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken csrfToken) {
        return new CsrfTokenResponse(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken()
        );
    }

    private AuthenticatedUserResponse toResponse(UserPrincipal principal) {
        return AuthenticatedUserResponse.builder()
                .id(principal.getUserId())
                .pictureVersion(principal.getPictureVersion())
                .privateEmail(principal.getPrivateEmail())
                .username(principal.getUsername())
                .privatePhoneNumber(principal.getPrivatePhoneNumber())
                .address(principal.getAddress())
                .status(principal.getStatus())
                .build();
    }
}
