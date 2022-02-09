window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('username').addEventListener('change', e => {
    document.getElementById('heading').innerText = `${e.target.value}'s Repositories`;
  });
});
