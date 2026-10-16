package com.teya1337.craigslist.auth.security;

import org.springframework.security.authentication.ProviderManager;
import org.springframework.stereotype.Component;

/**
 * UserAuthenticationManager
 *
 * @author teya1337
 * @since 10/12/26
 */
@Component
public class UserAuthenticationManager extends ProviderManager {

    public UserAuthenticationManager(UserAuthenticationProvider userAuthenticationProvider) {
        super(userAuthenticationProvider);
    }
}
