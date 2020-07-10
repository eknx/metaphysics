import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Users", () => {
  it("returns a list of users matching array of ids", async () => {
    const usersLoader = (data) => {
      if (data.id) {
        return Promise.resolve(data.id.map((id) => ({ id })))
      }
      throw new Error("Unexpected invocation")
    }
    const query = gql`
      {
        usersConnection(ids: ["5a9075da8b3b817ede4f8767"]) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { usersConnection } = await runAuthenticatedQuery(query, {
      usersLoader,
    })
    expect(usersConnection.edges[0].node.internalID).toEqual(
      "5a9075da8b3b817ede4f8767"
    )
  })
})
