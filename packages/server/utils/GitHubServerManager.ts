import fetch from 'node-fetch'
import GitHubManager from 'parabol-client/utils/GitHubManager'
import {stringify} from 'querystring'
import {getRepositories} from './githubQueries/getRepositories'
import {GetRepositoriesQuery} from '../../server/types/typed-document-nodes'

interface OAuth2Response {
  access_token: string
  error: any
  scope: string
}

type GQLResponse<TData> = {
  data: TData
  errors?: [
    {
      message: string
      path: [string]
      extensions: {
        [key: string]: any
      }
      locations: [
        {
          line: number
          column: number
        }
      ]
    }
  ]
}

interface GitHubCredentialError {
  message: string
  documentation_url: string
}
type GitHubResponse<TData> = GQLResponse<TData> | GitHubCredentialError
class GitHubServerManager extends GitHubManager {
  static async init(code: string) {
    return GitHubServerManager.fetchToken(code)
  }

  static async fetchToken(code: string) {
    const queryParams = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }

    const uri = `https://github.com/login/oauth/access_token?${stringify(queryParams)}`

    const tokenRes = await fetch(uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    const tokenJson = (await tokenRes.json()) as OAuth2Response
    const {access_token: accessToken, error, scope} = tokenJson
    if (error) {
      throw new Error(`GitHub: ${error}`)
    }
    const providedScope = scope.split(',')
    const matchingScope =
      new Set([...GitHubServerManager.SCOPE.split(','), ...providedScope]).size ===
      providedScope.length
    if (!matchingScope) {
      throw new Error(`GitHub Bad scope: ${scope}`)
    }
    return new GitHubServerManager(accessToken)
  }
  fetch = fetch

  // TODO: update name to just post once we've moved the GH client manager methods to the server
  private async serverPost<T>(body: string): Promise<GitHubResponse<T>> {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.headers,
      body
    })
    return await res.json()
  }
  constructor(accessToken: string) {
    super(accessToken)
  }

  async getRepositories() {
    const body = JSON.stringify({query: getRepositories, variables: {}})
    return this.serverPost<GetRepositoriesQuery>(body)
  }
}

export default GitHubServerManager
