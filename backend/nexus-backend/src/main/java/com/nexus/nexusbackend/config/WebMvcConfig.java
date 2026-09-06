package com.nexus.nexusbackend.config;

import com.nexus.nexusbackend.security.UserIdArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

/**
 * WebMvcConfig — registers the resolvers that turn raw request data into the
 * typed values controllers actually work with.
 *
 * The one resolver here, UserIdArgumentResolver, is the seam that closes the
 * auth loop: AuthFilter verifies the JWT and stashes a string; this resolver
 * presents it to controllers as an AuthenticatedUser. Keeping the registration
 * in one config class (rather than an annotation on the resolver) makes the
 * wiring explicit and testable.
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final UserIdArgumentResolver userIdArgumentResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(userIdArgumentResolver);
    }
}