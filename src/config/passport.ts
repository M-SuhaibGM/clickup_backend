import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { AuthService } from '../services/auth.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google account has no email'));

        const user = await AuthService.handleGoogleLogin({
          googleId: profile.id,
          email,
          name: profile.displayName || email.split('@')[0],
          avatar: profile.photos?.[0]?.value,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

// These are only for the OAuth handshake (session), not for API auth.
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => done(null, { id } as any));

export default passport;