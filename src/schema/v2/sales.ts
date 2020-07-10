import { SaleType } from "./sale/index"
import SaleSorts from "./sale/sorts"
import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionWithCursorInfo } from "./fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { BodyAndHeaders } from "lib/loaders"

export const SalesConnectionField: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: SaleType }).connectionType,
  description: "A list of Sales",
  args: pageable({
    // TODO: This wasn’t needed by Emission and is a tad awkward of an arg. If
    //       this was meant for refetching purposes, then we should add a plural
    //       `nodes` root field and use that instead.
    //
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return sales matching specified ids.
        Accepts list of ids.
      `,
    },
    isAuction: {
      description: "Limit by auction.",
      type: GraphQLBoolean,
    },
    live: {
      description: "Limit by live status.",
      type: GraphQLBoolean,
    },
    published: {
      description: "Limit by published status.",
      type: GraphQLBoolean,
    },
    sort: SaleSorts,
  }),
  resolve: async (
    _root,
    { ids, isAuction, live, published, sort, ...paginationArgs },
    {
      userRoles,
      unauthenticatedLoaders: { salesLoaderWithHeaders: loaderUnauthenticated },
      authenticatedLoaders: { salesLoaderWithHeaders: loaderAuthenticated },
    }
  ) => {
    paginationArgs.first = paginationArgs.first || 20
    const { page, size, offset } = convertConnectionArgsToGravityArgs(
      paginationArgs
    )
    let loader
    if (userRoles.includes("team") && ids.length) {
      loader = loaderAuthenticated
    } else {
      loader = loaderUnauthenticated
    }

    const { body: sales, headers } = ((await loader(
      {
        id: ids,
        is_auction: isAuction,
        live,
        published,
        sort,
        page,
        size,
        total_count: true,
      },
      { headers: true }
    )) as any) as BodyAndHeaders

    return connectionFromArraySlice(sales, paginationArgs, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: offset,
    })
  },
}
