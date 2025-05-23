import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnection from "@/config/db";
import loginModel from "@/model/SignUp";

export const authOptions = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        
        const { email, password } = credentials;

        console.log(email, password, "data");

        if (!email || !password ) {
          throw new Error("All fields are required");
        }

        try {
          await dbConnection(); // Connect to DB

          let user;

          user = await loginModel.findOne({ email });

          if (!user || !user.password) {
            console.log(user,"UsER" , user.password,"user.password");
            throw new Error("fields are required");
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            throw new Error("Invalid email or password");
          }

          return user; // Authentication successful
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin", // Custom sign-in page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id;
        token.name = user.name;
        token.email = user.email || "";
        token.role = user.role || "user";
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
      };
      return session;
    },
  },
});

export { authOptions as GET, authOptions as POST };
