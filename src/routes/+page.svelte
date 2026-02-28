<script>
    import { env } from '$env/dynamic/public';
    const { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_REDIRECT_URI } = env;

    let redirect_string = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${PUBLIC_GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
</script>

<h1>Welcome to George</h1>

<a href={redirect_string}><h2>Sign in With Google</h2></a>
