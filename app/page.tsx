import Link from "next/link";
import { Button } from "./components/Button";
import { UserMenu } from "./components/UserMenu";
import { getUser } from "./actions/auth";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header/Navigation */}
      <div className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">ListenExchange</h1>
          <UserMenu user={user} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-8">
          {/* Logo/Title */}
          <div>
            <div className="inline-block mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                ListenExchange
              </div>
            </div>
            <p className="text-2xl font-light text-gray-300 mt-4">
              Discover independent music. Share genuine feedback.
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <p className="text-lg text-gray-400">
              Help artists grow through meaningful feedback.
            </p>
            <p className="text-gray-500">
              Listen to curated tracks, engage with real songs, earn credits to
              share your own music.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/discover" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto">
                Start Listening
              </Button>
            </Link>
            <Link href="/submit" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Submit a Track
              </Button>
            </Link>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 pt-8 border-t border-gray-700">
            <div className="space-y-2">
              <div className="text-3xl">🎵</div>
              <h3 className="font-semibold">Discover</h3>
              <p className="text-sm text-gray-400">
                Explore independent tracks
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">💬</div>
              <h3 className="font-semibold">Feedback</h3>
              <p className="text-sm text-gray-400">Share meaningful reviews</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">⭐</div>
              <h3 className="font-semibold">Earn</h3>
              <p className="text-sm text-gray-400">Get credits for listening</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
