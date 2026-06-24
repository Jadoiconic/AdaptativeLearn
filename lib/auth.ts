import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from './mongodb';
import connectDB from '../database/connection';
import UserModel from '../database/models/User';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const user = await UserModel.findOne({ email: credentials.email.toLowerCase() }).select('+password');

          if (!user) {
            console.log('User not found:', credentials.email.toLowerCase());
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email.toLowerCase());
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            approvalStatus: user.approvalStatus,
            isActive: user.isActive,
            placementAssessment: user.placementAssessment,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.approvalStatus = user.approvalStatus;
        token.isActive = user.isActive;
        token.placementAssessment = user.placementAssessment;
      }
      
      // Handle session updates
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.approvalStatus = token.approvalStatus as string;
        session.user.isActive = token.isActive as boolean;
        session.user.placementAssessment = token.placementAssessment as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
