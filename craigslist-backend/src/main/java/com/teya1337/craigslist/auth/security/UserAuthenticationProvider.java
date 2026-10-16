package com.teya1337.craigslist.auth.security;

import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * UserAuthenticationProvider
 *
 * @author teya1337
 * @since 10/12/26
 */
@Component
public class UserAuthenticationProvider extends DaoAuthenticationProvider {

    public UserAuthenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        super(userDetailsService);
        setPasswordEncoder(passwordEncoder);
    }
}
