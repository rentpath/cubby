import React from 'react'
import { createStore } from '@cubbyjs/react'
import { Listings as IListings } from '../pages/api/listings'
import Link from 'next/link'

export const listingsStore = createStore<IListings>('listings', [])

export interface ListingsProps {}
export function Listings(props: ListingsProps) {
  const listings = listingsStore.useStore()

  return (
    <div className="container mx-auto">
      <div className="text-lg p-2 pl-4">Listings</div>
      <div>
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="flex justify-between align-middle rounded-md border-2 m-2 p-2"
          >
            <div>
              <div>
                <Link href={`/listing/${listing.id}`}>
                  <a>
                    <span className="text-sm">{listing.name}</span>
                  </a>
                </Link>
              </div>
              <span>
                <span className="text-xs">{listing.address}</span>
              </span>
            </div>
            <div className="text-sm">Number of Floorplans: {listing.floorplanCount}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
