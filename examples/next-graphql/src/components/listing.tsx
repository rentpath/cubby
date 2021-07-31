import React, { useState } from 'react'
import { createRemoteStore, createStore } from '@cubbyjs/react'
import { userIdStore } from './header'
import sdk from '../lib/sdk'
import { ListingQuery } from '../generated/graphql'

export const listingStore = createStore<ListingQuery['listing'] | null>('listing', null)

export const favoritesStore = createRemoteStore(
  'favorites',
  async function favoritesFetch(userId: number | null) {
    if (userId == null) {
      return null
    }
    const response = await sdk.User({ id: userId })
    const user = response.user
    return user?.favorites.map((fav) => fav.id) ?? []
  }
)

export interface ListingProps {}
export function Listing(_props: ListingProps) {
  const listing = listingStore.useStore()
  const userId = userIdStore.useStore()
  const { result: isFavorited } = favoritesStore.useRemoteStoreWithGetter(
    (favoriteListing) => favoriteListing?.some((id) => id === listing?.id) ?? false,
    userId
  )

  const [favoriteChanging, setFavoriteChanging] = useState(false)

  return (
    <div className="container mx-auto">
      <div className="flex justify-between">
        <div className="text-lg pb-2">{listing?.name}</div>
        {userId != null ? (
          <button
            onClick={async () => {
              const listingId = listing?.id
              if (favoriteChanging || listingId == null) {
                return
              }
              setFavoriteChanging(true)
              const method = isFavorited ? 'DELETE' : 'POST'
              if (isFavorited) {
                await sdk.RemoveFavorite({
                  userId,
                  listingId,
                })
              } else {
                await sdk.AddFavorite({
                  userId,
                  listingId,
                })
              }
              await favoritesStore.fetchQuery(userId)
              setFavoriteChanging(false)
            }}
          >
            {isFavorited ? 'Unfavorite' : 'Favorite'}
          </button>
        ) : null}
      </div>
      <div className="text-base pb-2">{listing?.address}</div>
      <div>
        {listing?.floorplans.map((floorplan) => (
          <div
            key={floorplan.id}
            className="flex justify-between align-middle rounded-md border-2 m-2 p-2"
          >
            <div className="text-sm">Beds: {floorplan.beds}</div>
            <div className="text-sm">Baths: {floorplan.baths}</div>
            <div className="text-sm">Square Feet: {floorplan.sqft}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
