import { SignIn } from "@clerk/react"

function LoginPage(){
    return(
        <div className="flex items-center justify-center min-h-screen">
           <SignIn />
        </div>
    )
  
}
export default LoginPage