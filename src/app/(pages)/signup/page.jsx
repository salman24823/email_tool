"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/handleSignup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || data.message || "Something went wrong");
      } else {
        toast.success("User added successfully!");
        setName("");
        setEmail("");
        setPassword("");

        // Navigate to signin
        setTimeout(() => {
          router.push("/signin");
        }, 1500);
      }
    } catch (error) {
      toast.error("Failed to Submit Credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <p className="text-center text-black text-xl font-semibold mb-6">
            Create a new account
          </p>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
              required
            />
          </div>

          <div className="relative mb-4">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
              required
            />
          </div>

          <div className="relative mb-4">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white text-sm font-medium py-3 px-5 rounded-lg uppercase"
          >
            Sign up
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{" "}
            <a href="/signin" className="underline">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
