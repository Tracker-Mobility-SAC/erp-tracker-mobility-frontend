import { BaseApi } from '../../shared/infrastructure/base-api.js';

/**
 * AuthenticationApi
 * Infrastructure layer — HTTP client for the authentication bounded context.
 * Extends BaseApi so it uses the shared axios instance (without auth interceptors,
 * because sign-in is a public endpoint).
 */
export class AuthenticationApi extends BaseApi {
    /**
     * Calls POST /authentication/sign-in with the provided credentials.
     * @param {import('../../domain/models/sign-in.request.js').SignInRequest} signInRequest
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    signIn(signInRequest) {
        return this.http.post('/authentication/sign-in', signInRequest);
    }
}
