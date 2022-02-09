const repositories = [];

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
});

async function init() {
  const result = await checkForErrors();

  if (!result.error) {
    document.getElementById('username').value = result.values.username;
    document.getElementById('access-token').value = result.values.access_token;
  }
}

async function fetchRepositories() {
  let page = 0;
  let pageEmpty = false;

  const list = document.getElementById('repositories');
  const errorUserNotFound = document.getElementById('error-user-not-found');

  list.innerHTML = '';

  errorUserNotFound.style.display = '';

  const { username, access_token } = await browser.storage.local.get([ 'username', 'access_token' ]);

  while (!pageEmpty) {
    const url = `https://api.github.com/users/${username}/repos?type=all&sort=updated&per_page=100&page=${page}`;

    const response = await fetch(url, { headers: { Authorization: access_token } });

    if (response.status === 404) {
      errorUserNotFound.style.display = 'block';
    } else {
      const repos = await response.json();

      if (repos.length === 0) {
        pageEmpty = true;
      } else {
        page++;
      }

      repositories.push(... repos);

      repos.forEach(repo => {
        const li = document.createElement('li');

        li.innerText = repo.owner.login === username
          ? repo.name
          : `${repo.owner.login}/${repo.name}`;
        list.appendChild(li);
      });
    }
  }
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
    fetchRepositories();
  }

  return { error, values: { username, access_token } };
}

async function listRepositories(reload = false) {
  let repositories;

  const list = document.getElementById('repositories');
  list.innerHTML = '';

  if (!reload) {
    repositories = await browser.storage.local.get('repositories').repositories;
  }

  if (repositories === undefined) {
    repositories = await fetchRepositories();
  }

  repositories.forEach(repository => {
    const li = document.createElement('li');

    li.innerText = repository.owner.login === username
      ? repository.name
      : `${repository.owner.login}/${repository.name}`;
    list.appendChild(li);
  });
}
