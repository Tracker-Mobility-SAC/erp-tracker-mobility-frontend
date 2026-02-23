/**
 * SignInResponse
 * Domain model — represents the data returned by the backend after a successful sign-in.
 */
export class SignInResponse {
    /**
     * @param {number} userId
     * @param {string} username
     * @param {string} token  - JWT bearer token
     * @param {string[]} roles - Array of role strings
     */
    constructor(userId, username, token, roles) {
        this.userId = userId;
        this.username = username;
        this.token = token;
        this.roles = roles || [];
    }
}
