import Link from "next/link";
import { getUser, signOut } from "@/app/actions/auth";
import { Button } from "@/app/components/Button";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">
            You need to be logged in to access this page.
          </p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-3xl font-bold cursor-pointer hover:text-green-400 transition-colors">
              ListenExchange
            </h1>
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="secondary" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-3xl font-bold mb-2">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {user.email}
              </span>
            </h2>
            <p className="text-gray-400">
              Your account is secure and ready to use.
            </p>
          </div>

          {/* Account Info */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Account Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">User ID</p>
                <p className="text-gray-300 font-mono text-sm break-all">
                  {user.id}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Account Created</p>
                <p className="text-white font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/discover" className="flex-1">
                <Button className="w-full">Start Listening</Button>
              </Link>
              <Link href="/submit" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Submit a Track
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
