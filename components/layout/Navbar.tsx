"use client";

import Link from "next/link";
import { Button } from "../ui/Button";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Zeno Meeting Prep
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/ad-hoc"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Ad-Hoc Research
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Settings
            </Link>
            <Button size="sm" variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
