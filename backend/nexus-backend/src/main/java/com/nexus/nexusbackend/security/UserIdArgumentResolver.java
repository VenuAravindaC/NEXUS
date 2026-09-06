package com.nexus.nexusbackend.security;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * UserIdArgumentResolver — the ONE adapter between the request attribute and
 * the typed AuthenticatedUser every controller method takes.
 *
 * Spring asks "how do I fill the AuthenticatedUser parameter of this handler?"
 * and this resolver answers: read the userId string that AuthFilter stashed on
 * the request after verifying the JWT, and wrap it in the type.
 *
 * SEAM: the trust boundary (AuthFilter) and the controller layer now agree on
 * a type. Nothing else reads the raw attribute — if the attribute ever
 * changes name or shape, this is the only file that knows.
 */
@Component
public class UserIdArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return AuthenticatedUser.class.equals(parameter.getParameterType());
    }

    @Override
    public AuthenticatedUser resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {

        // AuthFilter ran before us (it's a servlet filter, closer to the wire
        // than this). It already verified the token and set the attribute —
        // and it 401'd the request before we get here if the token was bad.
        String userId = (String) webRequest.getAttribute(
                ClerkJwtVerifier.USER_ID_ATTRIBUTE,
                RequestAttributes.SCOPE_REQUEST);

        // If we somehow reach a handler without a verified identity (someone
        // new endpoint forgot to stay under /api/), fail loudly rather than
        // carry a null identity around.
        if (userId == null) {
            throw new IllegalStateException(
                    "No verified userId on the request — AuthFilter did not run, or the handler is outside /api/");
        }
        return new AuthenticatedUser(userId);
    }
}