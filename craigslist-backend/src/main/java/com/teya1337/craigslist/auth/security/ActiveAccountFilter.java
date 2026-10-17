package com.teya1337.craigslist.auth.security;

import com.teya1337.craigslist.user.entity.UserStatus;
import com.teya1337.craigslist.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Rejects existing sessions too, rather than only blocking future sign-ins. */
@RequiredArgsConstructor
public class ActiveAccountFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            boolean active = userRepository.findById(principal.getUserId())
                    .map(user -> user.getStatus() == UserStatus.ACTIVE).orElse(false);
            if (!active) {
                new SecurityContextLogoutHandler().logout(request, response, authentication);
            }
        }
        chain.doFilter(request, response);
    }
}
