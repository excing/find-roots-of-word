// GitHub 认证及 Issues 相关代码

const GITHUB_CLIENT_ID = "Iv1.26792a5af3379280"
const GITHUB_CLIENT_SECRET = "a22c85062021e8e85a13a145d2813978d817cfaf"
const REPO_OWNER = "excing"
const REPO_NAME = "find-roots-of-word"

const historyIssues = new Map()

async function GithubIssue(title) {
  if (historyIssues.has(title)) {
    var issue = historyIssues.get(title)
    if (issue) {
      return Promise.resolve(issue)
    } else {
      return Promise.reject()
    }
  }
  return getGithubIssue(title)
}

async function CreateGithubIssue(title, body, label) {
  var token = localStorage.getItem("access_token")
  return postGithubIssue(
    token,
    title,
    body,
    [label, "invalid"])
}

function AuthorizeGithub(state, redirect_uri) {
  window.location = (`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&state=${state}&redirect_uri=${redirect_uri}`)
}

function LoginGithub() {
  var token = localStorage.getItem("access_token")
  if (!token || token === "") {
    // QA: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
    return Promise.reject()
  }
  var expiresTime = localStorage.getItem("expires_time")
  if (new Date().getTime() < new Number(expiresTime)) {
    return Promise.resolve()
  }
  var refreshTokenExpiresTime = localStorage.getItem("refresh_token_expires_time")
  if (new Number(refreshTokenExpiresTime) < new Date().getTime()) {
    return Promise.reject()
  }
  // 使用 refresh token 刷新当前 token

  var refreshToken = localStorage.getItem("refresh_token")
  var formData = new FormData()
  formData.append("client_id", GITHUB_CLIENT_ID)
  formData.append("client_secret", GITHUB_CLIENT_SECRET)
  formData.append("refresh_token", refreshToken)
  formData.append("grant_type", "refresh_token")
  return postAccessGithubToken(formData)
}

// AccessGithubToken is login oauth access token of github
async function AccessGithubToken(code, state, redirectURI) {
  var formData = new FormData()
  formData.append("client_id", GITHUB_CLIENT_ID)
  formData.append("client_secret", GITHUB_CLIENT_SECRET)
  formData.append("code", code)
  formData.append("state", state)
  formData.append("redirect_uri", redirectURI)
  return postAccessGithubToken(formData)
}

async function postAccessGithubToken(formData) {
  // QA: https://github.com/isaacs/github/issues/330
  return fetch("https://api.icsq.xyz/github/login/oauth/access_token", {
    method: "POST",
    // mode: 'no-cors',
    cache: 'no-cache',
    headers: {
      Accept: "application/vnd.github+json",
    },
    body: formData,
  })
    .then(responseOK)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw data.error
      }
      return data
    })
    .then(data => {
      let expiresIn = new Number(data.expires_in) * 1000 // 原单位为秒
      let refreshTokenExpiresIn = new Number(data.refresh_token_expires_in) * 1000
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("expires_time", new Date().getTime() + expiresIn)
      localStorage.setItem("refresh_token", data.refresh_token)
      localStorage.setItem("refresh_token_expires_time", new Date().getTime() + refreshTokenExpiresIn)
      localStorage.setItem("scope", data.scope)
      localStorage.setItem("token_type", data.token_type)
    })
}

// QA: https://docs.github.com/cn/rest/issues/issues#create-an-issue
// QA: https://github.com/excing/find-roots-of-word/labels
async function postGithubIssue(token, title, content, labels) {
  if (!token) return Promise.reject()
  var data = {
    title: title,
    body: content,
    labels: labels,
  }
  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: "POST",
    cache: "no-cache",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${token}`
    },
    body: JSON.stringify(data),
  })
    .then(responseOK)
    .then(response => response.json())
    .then(issue => {
      historyIssues.set(title, issue)
      return issue
    })
}

// QA: https://docs.github.com/cn/rest/search#search-issues-and-pull-requests
// QA: https://docs.github.com/cn/rest/search#constructing-a-search-query
// QA: https://docs.github.com/cn/search-github/searching-on-github/searching-issues-and-pull-requests
// TEST: https://api.github.com/search/issues?q=is:issue subterranean -- Bad root-affix combinations in:title repo:excing/find-roots-of-word
async function getGithubIssue(title) {
  var queryString = "q=" + encodeURIComponent(`is:issue ${title} in:title repo:${REPO_OWNER}/${REPO_NAME}`)
  return fetch(`https://api.github.com/search/issues?${queryString}`)
    .then(responseOK)
    .then(response => response.json())
    .then(data => {
      for (let index = 0; index < data.items.length; index++) {
        const issue = data.items[index]
        if (issue.title == title) {
          historyIssues.set(title, issue)
          return issue
        }
      }
      historyIssues.set(title, null)
      throw `No result`
    })
}

function responseOK(response) {
  if (!response.ok) {
    throw `${response.method}: ${response.statusText}`
  }
  return response
}