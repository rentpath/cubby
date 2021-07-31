import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import { gql } from 'graphql.macro';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Floorplan = {
  __typename?: 'Floorplan';
  baths: Scalars['Int'];
  beds: Scalars['Int'];
  id: Scalars['Int'];
  listing: Listing;
  listingId: Scalars['Int'];
  sqft: Scalars['Int'];
};

export type Listing = {
  __typename?: 'Listing';
  address: Scalars['String'];
  favoritedUsers: Array<User>;
  floorplans: Array<Floorplan>;
  id: Scalars['Int'];
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addFavorite?: Maybe<User>;
  removeFavorite?: Maybe<User>;
};


export type MutationAddFavoriteArgs = {
  listingId: Scalars['Int'];
  userId: Scalars['Int'];
};


export type MutationRemoveFavoriteArgs = {
  listingId: Scalars['Int'];
  userId: Scalars['Int'];
};

export type Query = {
  __typename?: 'Query';
  listing?: Maybe<Listing>;
  listings?: Maybe<Array<Maybe<Listing>>>;
  user?: Maybe<User>;
  users?: Maybe<Array<Maybe<User>>>;
};


export type QueryListingArgs = {
  id: Scalars['Int'];
};


export type QueryUserArgs = {
  id: Scalars['Int'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String'];
  favorites: Array<Listing>;
  id: Scalars['Int'];
};

export type AddFavoriteMutationVariables = Exact<{
  userId: Scalars['Int'];
  listingId: Scalars['Int'];
}>;


export type AddFavoriteMutation = (
  { __typename?: 'Mutation' }
  & { addFavorite?: Maybe<(
    { __typename?: 'User' }
    & { favorites: Array<(
      { __typename?: 'Listing' }
      & Pick<Listing, 'id'>
    )> }
  )> }
);

export type ListingQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type ListingQuery = (
  { __typename?: 'Query' }
  & { listing?: Maybe<(
    { __typename?: 'Listing' }
    & Pick<Listing, 'id' | 'address' | 'name'>
    & { floorplans: Array<(
      { __typename?: 'Floorplan' }
      & Pick<Floorplan, 'id' | 'baths' | 'beds' | 'sqft'>
    )> }
  )> }
);

export type ListingsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListingsQuery = (
  { __typename?: 'Query' }
  & { listings?: Maybe<Array<Maybe<(
    { __typename?: 'Listing' }
    & Pick<Listing, 'id' | 'address' | 'name'>
    & { floorplans: Array<(
      { __typename?: 'Floorplan' }
      & Pick<Floorplan, 'id'>
    )> }
  )>>> }
);

export type RemoveFavoriteMutationVariables = Exact<{
  userId: Scalars['Int'];
  listingId: Scalars['Int'];
}>;


export type RemoveFavoriteMutation = (
  { __typename?: 'Mutation' }
  & { removeFavorite?: Maybe<(
    { __typename?: 'User' }
    & { favorites: Array<(
      { __typename?: 'Listing' }
      & Pick<Listing, 'id'>
    )> }
  )> }
);

export type UserQueryVariables = Exact<{
  id: Scalars['Int'];
}>;


export type UserQuery = (
  { __typename?: 'Query' }
  & { user?: Maybe<(
    { __typename?: 'User' }
    & Pick<User, 'email' | 'id'>
    & { favorites: Array<(
      { __typename?: 'Listing' }
      & Pick<Listing, 'id'>
    )> }
  )> }
);

export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = (
  { __typename?: 'Query' }
  & { users?: Maybe<Array<Maybe<(
    { __typename?: 'User' }
    & Pick<User, 'email' | 'id'>
  )>>> }
);


export const AddFavoriteDocument = gql`
    mutation AddFavorite($userId: Int!, $listingId: Int!) {
  addFavorite(listingId: $listingId, userId: $userId) {
    favorites {
      id
    }
  }
}
    `;
export const ListingDocument = gql`
    query Listing($id: Int!) {
  listing(id: $id) {
    id
    address
    name
    floorplans {
      id
      baths
      beds
      sqft
    }
  }
}
    `;
export const ListingsDocument = gql`
    query Listings {
  listings {
    id
    address
    name
    floorplans {
      id
    }
  }
}
    `;
export const RemoveFavoriteDocument = gql`
    mutation RemoveFavorite($userId: Int!, $listingId: Int!) {
  removeFavorite(listingId: $listingId, userId: $userId) {
    favorites {
      id
    }
  }
}
    `;
export const UserDocument = gql`
    query User($id: Int!) {
  user(id: $id) {
    email
    id
    favorites {
      id
    }
  }
}
    `;
export const UsersDocument = gql`
    query Users {
  users {
    email
    id
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    AddFavorite(variables: AddFavoriteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<AddFavoriteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddFavoriteMutation>(AddFavoriteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'AddFavorite');
    },
    Listing(variables: ListingQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListingQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListingQuery>(ListingDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Listing');
    },
    Listings(variables?: ListingsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<ListingsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ListingsQuery>(ListingsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Listings');
    },
    RemoveFavorite(variables: RemoveFavoriteMutationVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<RemoveFavoriteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveFavoriteMutation>(RemoveFavoriteDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'RemoveFavorite');
    },
    User(variables: UserQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<UserQuery>(UserDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'User');
    },
    Users(variables?: UsersQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<UsersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<UsersQuery>(UsersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Users');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;