package com.teya1337.craigslist.account;

import com.teya1337.craigslist.auth.security.UserPrincipal;
import com.teya1337.craigslist.user.profile.ProfileUpdateRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;
    private final HttpSessionSecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody AccountRequest account,
                       HttpServletRequest request, HttpServletResponse response) {
        refreshSession(accountService.updateAccount(principal.getUserId(), account), request, response);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody PasswordChangeRequest password,
                               HttpServletRequest request, HttpServletResponse response) {
        refreshSession(accountService.changePassword(principal.getUserId(), password), request, response);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody DeleteAccountRequest account,
                       HttpServletRequest request, HttpServletResponse response) {
        accountService.deleteAccount(principal.getUserId(), account);
        new SecurityContextLogoutHandler().logout(request, response, SecurityContextHolder.getContext().getAuthentication());
    }

    @PutMapping(value = "/profile", consumes = "application/json")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateProfile(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ProfileUpdateRequest profile) {
        accountService.updateProfile(principal.getUserId(), profile);
    }

    private void refreshSession(UserPrincipal principal, HttpServletRequest request, HttpServletResponse response) {
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities()));
        SecurityContextHolder.setContext(context);
        request.changeSessionId();
        securityContextRepository.saveContext(context, request, response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> accountError(
            ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("detail", exception.getReason() == null ? "Please sign in again." : exception.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> duplicateAccount() {
        return Map.of("detail", "That username or email is already in use.");
    }
}
