// GitHub 认证及 Issues 相关代码

const GITHUB_CLIENT_ID = "Iv1.26792a5af3379280"
const GITHUB_CLIENT_SECRET = "a22c85062021e8e85a13a145d2813978d817cfaf"

async function CreateGithubIssue(title, body, label) {
  var token = localStorage.getItem("access_token")
  return postGithubIssue(
    token,
    title,
    body,
    [label,])
}

function AuthorizeGithub(state, redirect_uri) {
  window.location = (`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&state=${state}&redirect_uri=${redirect_uri}`)
}

function LoginGithub() {
  var token = localStorage.getItem("access_token")
  if (!token || token === "") {
    // QA: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
    return Promise.reject("unlogin")
  }
  var expiresTime = localStorage.getItem("expires_time")
  if (new Date().getTime() < new Number(expiresTime)) {
    return Promise.resolve(token)
  }
  var refreshTokenExpiresTime = localStorage.getItem("refresh_token_expires_time")
  if (new Number(refreshTokenExpiresTime) < new Date().getTime()) {
    return Promise.reject("unlogin")
  }
  // 使用 refresh token 刷新当前 token

  var refreshToken = localStorage.getItem("refresh_token")
  var formData = new FormData()
  formData.append("client_id", GITHUB_CLIENT_ID)
  formData.append("client_secret", GITHUB_CLIENT_SECRET)
  formData.append("refresh_token", refreshToken)
  formData.append("grant_type", refreshToken)
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
    body: formData,
  })
    .then(response => {
      if (!response.ok) {
        throw `Get github access token failed: ${response.statusText}`
      }
      return response
    })
    .then(response => response.text())
    .then(text => new URL("access_token?" + text, location.origin).searchParams)
    .then(params => {
      let expiresIn = new Number(params.get("expires_in")) * 1000 // 原单位为秒
      let refreshTokenExpiresIn = new Number(params.get("refresh_token_expires_in")) * 1000
      localStorage.setItem("access_token", params.get("access_token"))
      localStorage.setItem("expires_time", new Date().getTime() + expiresIn)
      localStorage.setItem("refresh_token", params.get("refresh_token"))
      localStorage.setItem("refresh_token_expires_time", new Date().getTime() + refreshTokenExpiresIn)
      localStorage.setItem("scope", params.get("scope"))
      localStorage.setItem("token_type", params.get("token_type"))
    })
}

// QA: https://docs.github.com/cn/rest/issues/issues#create-an-issue
async function postGithubIssue(token, title, content, labels) {
  if (!token) return Promise.reject()
  var data = {
    title: title,
    body: content,
    labels: labels,
  }
  return fetch("https://api.github.com/repos/excing/find-roots-of-word/issues", {
    method: "POST",
    cache: "no-cache",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `token ${token}`
    },
    body: JSON.stringify(data),
  })
    .then(response => {
      if (!response.ok) {
        throw `Get github access token failed: ${response.statusText}`
      }
      return response
    })
    .then(response => response.json())
    .then(data => data.number)
}