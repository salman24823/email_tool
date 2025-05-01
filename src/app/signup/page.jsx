import React from 'react';

const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <form>
          <p className="text-center text-black text-xl font-semibold mb-6">
            Create a new account
          </p>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
            />
          </div>

          <div className="relative mb-4">
            <input
              type="email"
              placeholder="Enter email"
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
            />
          </div>

          <div className="relative mb-4">
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-4 py-4 text-sm rounded-lg border border-gray-300 shadow-sm outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white text-sm font-medium py-3 px-5 rounded-lg uppercase"
          >
            Sign up
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
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
