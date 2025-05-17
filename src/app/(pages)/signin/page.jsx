"use client";

import React, { useState } from "react";
import { Mail, Lock } from "lucide-react"; // Import Lucide icons
import { toast } from "react-toastify";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Default role

  const { data: session } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Use NextAuth to sign in
      const loginRes = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false, // Don't auto redirect
      });

      if (loginRes?.error) {
        toast.error("Error in login: Invalid Email, Password or Role");
        setLoading(false);
        return;
      }

      toast.success("Login Successful.");

      setLoading(false);

      location.replace("/"); // Redirect to home page
    } catch (error) {
      console.log(error);
      toast.error("An error occurred during login");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-[sans-serif]">
      <h2>User : {session?.user?.name} </h2>
      <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4">
        <div className="grid md:grid-cols-2 items-center gap-6 max-w-6xl w-full">
          <div className="border border-gray-300 rounded-lg p-6 max-w-md shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-md:mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-6">
                <h3 className="text-gray-800 text-3xl font-bold">Sign in</h3>
                <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                  Manage your inventory effortlessly with organized data and
                  keep your business running smoothly.
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="text-gray-800 text-sm mb-2 block">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 text-gray-400" size={20} />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-sm text-gray-800 border border-gray-300 pl-10 pr-4 py-3 rounded-lg outline-blue-600"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-gray-800 text-sm mb-2 block">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 text-gray-400" size={20} />
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-sm text-gray-800 border border-gray-300 pl-10 pr-4 py-3 rounded-lg outline-blue-600"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {/* Sign-in Button */}
              <div className="!mt-8 w-full">
                <button
                  type="submit"
                  className="w-full shadow-xl py-2.5 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {loading ? "Loading..." : "Sign in"}
                </button>
                <div className="">
                  <hr className="my-6" />
                  <div className="flex w-full justify-center text-center">
                    <a href="/signup" className="text-gray-700">
                      Register New Account !
                    </a>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Side Image */}
          <div className="max-md:mt-8">
            <img
              src="https://readymadeui.com/login-image.webp"
              className="w-full aspect-[71/50] max-md:w-4/5 mx-auto block object-cover"
              alt="Dining Experience"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
