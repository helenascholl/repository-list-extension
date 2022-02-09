let repos = [];

window.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('username').addEventListener('change', e => {
    browser.storage.local.set({ username: e.target.value })
      .then(checkForErrors);
  });

  document.getElementById('access-token').addEventListener('change', e => {
    browser.storage.local.set({ access_token: e.target.value })
      .then(checkForErrors);
  });

  document.getElementById('reload').addEventListener('click', () => {
    loadRepositories(true);
  });

  document.getElementById('search').addEventListener('input', e => {
    search(e.target.value);
  });
});

async function init() {
  const result = await checkForErrors();

  if (!result.error) {
    document.getElementById('username').value = result.values.username;
    document.getElementById('access-token').value = result.values.access_token;
  }

  document.getElementById('search').focus();
}

async function fetchRepositories() {
  const allRepositories = [];
  const errorUserNotFound = document.getElementById('error-user-not-found');
  const { username, access_token } = await browser.storage.local.get([ 'username', 'access_token' ]);
  let page = 0;
  let pageEmpty = false;

  errorUserNotFound.style.display = '';

  while (!pageEmpty) {
    const url = `https://api.github.com/users/${username}/repos?type=all&sort=updated&per_page=100&page=${page}`;

    const response = await fetch(url, { headers: { Authorization: access_token } });

    if (response.status === 404) {
      errorUserNotFound.style.display = 'block';
    } else {
      const repositories = (await response.json()).map(r => {
        return {
          name: r.name,
          url: r.html_url,
          owner: r.owner.login
        }
      });

      if (repositories.length === 0) {
        pageEmpty = true;
      } else {
        page++;
      }

      allRepositories.push(... repositories);
    }
  }

  browser.storage.local.set({ repositories: allRepositories });

  return allRepositories;
}

async function checkForErrors() {
  const errorNoAccessToken = document.getElementById('error-no-access-token');
  const errorNoUsername = document.getElementById('error-no-username');

  const { username, access_token } = await browser.storage.local.get([ 'username', 'access_token' ]);
  let error = false;

  errorNoUsername.style.display = '';
  errorNoAccessToken.style.display = '';

  if (username === undefined) {
    error = true;
    errorNoUsername.style.display = 'block';
  }

  if (access_token === undefined) {
    error = true;
    errorNoAccessToken.style.display = 'block';
  }

  if (!error){
    loadRepositories();
  }

  return { error, values: { username, access_token } };
}

async function loadRepositories(reload = false) {
  let repositories;

  const list = document.getElementById('repositories');
  list.innerHTML = 'Loading ...';

  if (!reload) {
    repositories = (await browser.storage.local.get('repositories')).repositories;
  }

  if (repositories === undefined) {
    repositories = await fetchRepositories();
  }

  repos = repositories;

  listRepositories();
}

async function listRepositories(repositories = repos) {
  const list = document.getElementById('repositories');
  const username = (await browser.storage.local.get('username')).username;

  list.innerHTML = '';

  repositories.forEach(repository => {
    const li = document.createElement('li');
    const a = document.createElement('a');

    a.innerText = repository.owner === username
      ? repository.name
      : `${repository.owner}/${repository.name}`;
    a.href = repository.url;

    li.appendChild(a);
    list.appendChild(li);
  });
}

function search(query) {
  listRepositories(repos.filter(repo => repo.name.toLowerCase().includes(query.toLowerCase())));
}

function log(message) {
  const debug = document.getElementById('debug');
  debug.style.display = 'block';
  debug.innerText += typeof message === 'object' || typeof message === 'array'
    ? `${JSON.stringify(message)}\n`
    : `${message}\n`;
}
