import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db/client'
import { campaigns, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login')
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  })

  // Get campaigns
  const userCampaigns = user
    ? await db.query.campaigns.findMany({
        where: eq(campaigns.userId, user.id),
        with: {
          webhookSubscription: true,
        },
        orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
      })
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your sales campaigns and calendar integrations
            </p>
          </div>
          <Link
            href="/settings/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Campaign
          </Link>
        </div>

        {/* Campaigns List */}
        {userCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No campaigns yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first campaign to start automatically researching your sales meetings
              </p>
              <Link
                href="/settings/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {userCampaigns.map((campaign) => {
              const painPoints = JSON.parse(campaign.keyPainPoints || '[]') as string[]
              const webhookStatus = campaign.webhookSubscription?.status || 'none'

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {campaign.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                        {webhookStatus === 'active' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Webhook Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-1">
                        <span className="font-medium">Calendar:</span>{' '}
                        {campaign.googleCalendarName}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Company:</span>{' '}
                        {campaign.companyName} ({campaign.companyDomain})
                      </p>
                    </div>
                    <Link
                      href={`/settings/${campaign.id}/edit`}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                    >
                      Edit
                    </Link>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Offering
                      </h4>
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {campaign.offeringTitle}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {campaign.offeringDescription}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Pain Points
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {painPoints.slice(0, 3).map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span className="line-clamp-1">{point}</span>
                          </li>
                        ))}
                        {painPoints.length > 3 && (
                          <li className="text-gray-500 italic">
                            +{painPoints.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                    {campaign.webhookSubscription && (
                      <span>
                        Webhook expires{' '}
                        {new Date(campaign.webhookSubscription.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
