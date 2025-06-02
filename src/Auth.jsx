import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { supabase } from "./supabase"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()


  const handleSubmit = async (e) => {
  e.preventDefault()
  let result

  try {
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
      console.log("SignUp result:", result)

      const userId = result.data?.user?.id
      console.log("New User ID:", userId)

      if (userId) {
        const { error } = await supabase.from("profiles").insert({
          id: userId,
          name: email.split("@")[0],
          plan: "starter",
          trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        if (error) {
          console.error("Profile insert error:", error.message)
        } else {
          console.log("Profile inserted successfully.")
        }
      } else {
        console.warn("No user ID returned from signUp.")
      }
    }

    if (result.error) {
      setMessage(result.error.message)
    } else {
      setMessage(isLogin ? "Logged in!" : "Check your email for confirmation.")
      
      // Redirect after successful login
      if (isLogin) {
        navigate("/")
      }
    }
  } catch (err) {
    console.error("SignUp exception:", err)
  }
}



  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">{isLogin ? "Login" : "Sign Up"}</h2>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <p className="text-sm text-center mt-4 cursor-pointer text-blue-500" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
        </p>
        {message && <p className="text-center text-sm mt-4 text-red-500">{message}</p>}
      </form>
    </div>
  )
}
