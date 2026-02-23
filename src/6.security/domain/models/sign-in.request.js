/**
 * SignInRequest
 * Domain model — represents the data required to authenticate a user.
 */
export class SignInRequest {
    /**
     * @param {string} username
     * @param {string} password
     */
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
}
