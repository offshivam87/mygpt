import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from 'axios'





export default function Login() {

  const navigate = useNavigate()
  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Submit Function
  const onSubmit = (data) => {
    axios.post('http://localhost:3000/api/auth/login', { 
      email:data.email,
      password:data.password
    } , {
      withCredentials:true
    }
  ).then((res)=>{
    console.log(res)
    navigate('/')
  }).catch((err)=>{ console.log(err);
  })
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Login
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Email */}
          <div>
            <label className="text-gray-600 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-600 text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              {...register("password", {
                required: "Password is required",
                
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Login
          </button>
        </form>

        {/* Bottom Text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Don’t have an account?
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline ml-1"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
